import OpenAI from 'openai'
import { MenuItem, CartItem, AIChatMessage, AIOrderIntent } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function processAIOrder(
  userMessage: string,
  menuItems: MenuItem[],
  currentCart: CartItem[],
  chatHistory: AIChatMessage[]
): Promise<{ response: string; intent: AIOrderIntent | null }> {
  const menuItemsList = menuItems.map(item => {
    const customizations = item.customizations?.map(c => `  - ${c.name} (${c.type})${c.price > 0 ? ` +$${c.price.toFixed(2)}` : ''}`).join('\n') || ''
    return `- ${item.name} (ID: ${item.id}): $${item.price.toFixed(2)} - ${item.description || 'No description'}${customizations ? '\n  Customizations:\n' + customizations : ''}`
  }).join('\n')

  const systemPrompt = `You are a helpful AI assistant for a Jollibee ordering kiosk. Your job is to:
1. Understand customer orders from natural language (English, Tagalog, or Taglish)
2. Extract menu items, quantities, and customizations
3. Match items to the available menu (use the exact item name or ID)
4. Respond conversationally and confirm actions
5. Answer questions about the menu

LANGUAGE SUPPORT:
- You MUST understand and respond in the SAME language the customer uses
- Support English, Tagalog (Filipino), and Taglish (Tagalog-English mix)
- Common Tagalog ordering phrases:
  * "Gusto ko ng..." / "I want..." / "Pahingi ng..." = "I want..."
  * "Dalawang..." / "Two..." = quantity
  * "Malaki" / "Large" = large size
  * "Regular" = regular size
  * "Maliit" / "Small" = small size
  * "Dagdag" / "Add" = add-ons
  * "Tanggalin" / "Remove" = remove items
  * "Magkano?" / "How much?" = asking price
- Respond naturally in the customer's language preference

Available menu items:
${menuItemsList}

Current cart:
${currentCart.length === 0 ? 'Cart is empty' : currentCart.map(item => `- ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

IMPORTANT: You must respond in JSON format with this structure:
{
  "response": "Your conversational response to the user (in their language)",
  "intent": {
    "action": "add" | "remove" | "modify" | "clear" | "query",
    "items": [{
      "menuItemId": "item id from menu",
      "name": "exact item name from menu",
      "quantity": number,
      "customizations": {
        "size": "large" | "regular" | "small" | "",
        "addons": ["addon name"],
        "modifications": "special instructions"
      }
    }]
  }
}

Rules:
- If the user wants to order, set action to "add" and include items array
- If the user wants to remove items, set action to "remove" and include items array
- If the user wants to clear cart, set action to "clear" with empty items array
- If the user is just asking a question, set action to "query" with empty items array
- Always match item names exactly to the menu items provided (even if user uses Tagalog/Taglish)
- Use the menuItemId from the available menu items
- Be friendly and conversational in your response text
- Match the language and tone of the customer's message`

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-10).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const rawResponse = completion.choices[0]?.message?.content || '{"response": "I apologize, I encountered an error processing your request.", "intent": null}'
    
    let response = 'I apologize, I encountered an error processing your request.'
    let intent: AIOrderIntent | null = null

    try {
      const parsed = JSON.parse(rawResponse)
      response = parsed.response || response
      
      if (parsed.intent) {
        intent = parsed.intent
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e)
      // Fallback: try to extract a conversational response
      response = rawResponse
    }

    return {
      response,
      intent,
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      response: 'I apologize, I encountered an error. Please try again or use the menu to place your order.',
      intent: null,
    }
  }
}

