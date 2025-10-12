import OpenAI from 'openai'
import { MenuItem, CartItem, AIChatMessage, AIOrderIntent } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description: "Adds items to the customer's cart. Use this when the customer wants to order something.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                menuItemId: { type: "string", description: "Optional. The exact ID if known." },
                name: { type: "string", description: "The name of the menu item (e.g. '1-pc Chickenjoy')" },
                quantity: { type: "number", description: "Quantity to add" },
                customizations: {
                  type: "object",
                  description: "Any customizations like size, add-ons, etc."
                }
              },
              required: ["name", "quantity"]
            }
          }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "remove_from_cart",
      description: "Removes items from the customer's cart. Use this when they want to delete, cancel or remove something.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                menuItemId: { type: "string", description: "The exact ID of the menu item" },
                name: { type: "string", description: "The name of the menu item" },
              },
              required: ["name"]
            }
          }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_cart_quantity",
      description: "Updates the quantity of an item already in the cart.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                menuItemId: { type: "string", description: "The exact ID of the menu item" },
                name: { type: "string", description: "The name of the menu item" },
                quantity: { type: "number", description: "The new total quantity for this item" },
              },
              required: ["name", "quantity"]
            }
          }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "clear_cart",
      description: "Clears all items from the customer's cart.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

export async function processAIOrder(
  userMessage: string,
  currentCart: CartItem[],
  chatHistory: AIChatMessage[],
  menuString: string
): Promise<{ response: string; intent: AIOrderIntent | null }> {

  const systemPrompt = `You are a helpful and energetic AI assistant for a Jollibee ordering kiosk. Your job is to:
1. Understand customer orders from natural language (English, Tagalog, or Taglish)
2. Use tools to add, remove, update, or clear items from the cart based on user requests
3. Respond conversationally and confirm actions
4. Answer generally about Jollibee (Chickenjoy, Burgers, Jolly Spaghetti, Fries, etc.)

LANGUAGE & TONE RULES:
- You MUST understand and respond in the SAME language the customer uses. If the user speaks in Tagalog, you MUST respond in Tagalog. If English, respond in English.
- Support English, Tagalog (Filipino), and Taglish (Tagalog-English mix)
- Common Tagalog phrases: "Gusto ko ng..." (I want...), "Dalawang..." (Two...), "Malaki" (Large)
- Respond naturally, enthusiastically, and politely.
- ALWAYS end your response by asking if there is anything else you can do or help them with (e.g., "Is there anything else I can get for you?", "May idadagdag pa ba kayo?").

AVAILABLE MENU ITEMS:
${menuString}

Current cart context:
${currentCart.length === 0 ? 'Cart is empty' : currentCart.map(item => `- ${item.quantity}x ${item.name} - ₱${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Rules:
- IMPORTANT DECOMPOSITION RULE: If the user requests MULTIPLE distinct items (e.g., "Get me X. Also add Y" or "X and Y"), you MUST:
  1. Mentally count every single distinct core item (e.g., 2-pc combo is ONE item, 6-pc bucket is ONE item).
  2. Ensure your \`add_to_cart\` tool call contains an \`items\` array with EXACTLY that many objects. DO NOT merge different meal types into one object! DO NOT drop any items!
- Call the \`add_to_cart\` tool using the EXACT item name from the AVAILABLE MENU ITEMS above.
- "Ala carte" / "solo" means the item without extras — just add the base item with no customizations.
- When processing drinks, sides, or upgrades:
  - FIRST check if the drink/side/upgrade is listed under a customization group (shown in brackets like [Add a Drink]) for the main item.
  - If YES: You MUST put it inside the \`customizations\` object of the main item. DO NOT add it as a separate item in the array.
  - If NO: You MUST add it as a separate item in the items array using the \`add_to_cart\` tool.
- CUSTOMIZATION FORMAT: Use the GROUP NAME (the text in brackets, e.g. "Add a Drink") as the key, and the EXACT option name as listed (e.g. "Pineapple Juice") as the value.
  Example: { "Add a Drink": "Pineapple Juice", "Add Fries": "Regular Fries" }
- IMPORTANT: If the user requests a size variant (e.g. "large pineapple juice") but the menu only lists one size for that option (e.g. just "Pineapple Juice"), use the EXACT option name that IS listed. Do NOT invent names like "Large Pineapple Juice" if that is not in the list.
- CHICKEN TYPE: For Chickenjoy items that have a [Chicken Type] option (Regular Chickenjoy / Spicy Chickenjoy), the default is Regular. If the user does not mention spicy, use { "Chicken Type": "Regular Chickenjoy" }. If they say "spicy", use { "Chicken Type": "Spicy Chickenjoy" }. Always mention which type was chosen in your confirmation message.
- For buckets: If the user asks for a split of spicy and regular pieces (e.g., 3 spicy), add this inside the \`customizations\` object (e.g., "Spiciness": "3 Spicy, 3 Regular").
- If the user wants to change quantity, call \`update_cart_quantity\`.
- If the user wants to remove items, call \`remove_from_cart\`.
- If the order is unclear, ambiguous, or asks for an item not on the menu, DO NOT guess or add an incorrect item. Instead, politely ask the user to clarify their order.
- If providing a tool call, ALSO include a friendly message acknowledging what you did.`

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
      model: 'gpt-5.4-nano',
      messages,
      temperature: 0.7,
      tools: tools,
      tool_choice: "auto",
    })

    const message = completion.choices[0]?.message;
    let response = message?.content || '';
    let intent: AIOrderIntent | null = null;

    if (!message) {
      return {
        response: "I apologize, I encountered an error. Please try again or use the menu to place your order.",
        intent: null
      }
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      if (toolCall.function.name === 'add_to_cart') {
        intent = { action: 'add', items: args.items };
        if (!response) response = `Added the items to your cart! Is there anything else you'd like to order?`;
      } else if (toolCall.function.name === 'remove_from_cart') {
        intent = { action: 'remove', items: args.items };
        if (!response) response = `I've removed those items for you. What else can I do for you today?`;
      } else if (toolCall.function.name === 'update_cart_quantity') {
        intent = { action: 'modify', items: args.items };
        if (!response) response = `I've updated the quantity in your cart. Anything else?`;
      } else if (toolCall.function.name === 'clear_cart') {
        intent = { action: 'clear', items: [] };
        if (!response) response = `I've cleared your cart. How else can I help you?`;
      }
    } else {
      if (!response) {
        response = 'I can definitely help with that! What would you like to order today?';
      }
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
