import { NextRequest, NextResponse } from 'next/server'
import { processAIOrder } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { CartItem, AIChatMessage } from '@/lib/types'
import { applyIntentToCart } from '@/lib/ai-cart'
import { aiChatRequestSchema } from '@/lib/schemas'
import { ZodError } from 'zod'

type MenuCustomization = {
  group: string
  customizationItem: {
    name: string
    price: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory, cart } = aiChatRequestSchema.parse(await request.json())

    // Fetch menu items
    const menuItems = await prisma.menuItem.findMany({
      include: {
        customizations: {
          include: {
            customizationItem: true
          }
        },
      },
    })

    // Process AI order
    const menuString = menuItems.map(m => {
      let customizationStr = ''
      if (m.customizations && m.customizations.length > 0) {
        const groups = new Map<string, string[]>()
        for (const c of (m.customizations as MenuCustomization[])) {
          if (!groups.has(c.group)) groups.set(c.group, [])
          const optLabel = c.customizationItem.price > 0
            ? `${c.customizationItem.name} (+₱${c.customizationItem.price})`
            : c.customizationItem.name
          groups.get(c.group)!.push(optLabel)
        }
        const groupLines = Array.from(groups.entries())
          .map(([group, opts]) => `    [${group}]: ${opts.join(', ')}`)
        customizationStr = '\n' + groupLines.join('\n')
      }
      return `- ${m.name} (₱${m.price})${customizationStr}`
    }).join('\n')
    const { response, intent } = await processAIOrder(
      message,
      cart,
      chatHistory as AIChatMessage[],
      menuString
    )

    const { cartUpdate, addedItems } = applyIntentToCart(
      cart,
      intent,
      menuItems
    )

    let finalResponse = response
    if (cartUpdate !== null) {
      const itemsCount = cartUpdate.reduce((sum, item) => sum + item.quantity, 0)

      const totalPrice = cartUpdate.reduce((sum, item) => {
        let customizationTotal = 0
        if (item.customizations) {
          customizationTotal = Object.values(item.customizations).reduce((acc, curr) => acc + curr.price, 0)
        }
        return sum + (item.price + customizationTotal) * item.quantity
      }, 0)

      const isTagalog = finalResponse.toLowerCase().includes('kasalukuyang') || finalResponse.toLowerCase().includes('ba kayo') || finalResponse.toLowerCase().includes('maitutulong')

      const tallyText = isTagalog
        ? `\n\n🛒 Kasalukuyang Order: ${itemsCount} items (₱${totalPrice.toFixed(0)})`
        : `\n\n🛒 Current Order: ${itemsCount} items (₱${totalPrice.toFixed(0)})`

      finalResponse += tallyText
    }

    return NextResponse.json({
      response: finalResponse,
      intent,
      cartUpdate,
      addedItems: addedItems.length > 0 ? addedItems : undefined
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid chat payload' },
        { status: 400 }
      )
    }

    console.error('Error processing AI chat:', error)
    return NextResponse.json(
      {
        response: 'I apologize, I encountered an error processing your request. Please try again.',
        intent: null,
        cartUpdate: null,
      },
      { status: 500 }
    )
  }
}
