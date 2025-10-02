import { NextRequest, NextResponse } from 'next/server'
import { processAIOrder } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { CartItem, AIChatMessage } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory, cart } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Fetch menu items
    const menuItems = await prisma.menuItem.findMany({
      include: {
        customizations: true,
      },
    })

    // Process AI order
    const { response, intent } = await processAIOrder(
      message,
      menuItems,
      cart || [],
      (chatHistory || []) as AIChatMessage[]
    )

    // Handle intent if present
    let cartUpdate: CartItem[] | null = null

    if (intent) {
      const currentCart = [...(cart || [])]

      if (intent.action === 'add' && intent.items && intent.items.length > 0) {
        // Add items to cart
        for (const item of intent.items) {
          // Find matching menu item by ID first, then by name
          let menuItem = menuItems.find((mi) => mi.id === item.menuItemId)
          
          if (!menuItem && item.name) {
            menuItem = menuItems.find((mi) => 
              mi.name.toLowerCase() === item.name.toLowerCase() ||
              mi.name.toLowerCase().includes(item.name.toLowerCase())
            )
          }

          if (menuItem) {
            const cartItem: CartItem = {
              menuItemId: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              quantity: item.quantity || 1,
              customizations: item.customizations || {},
            }
            currentCart.push(cartItem)
          }
        }
        cartUpdate = currentCart
      } else if (intent.action === 'remove' && intent.items && intent.items.length > 0) {
        // Remove items from cart - match by name or ID
        cartUpdate = currentCart.filter((cartItem) => {
          return !intent.items?.some(item => {
            const matchById = item.menuItemId && cartItem.menuItemId === item.menuItemId
            const matchByName = item.name && cartItem.name.toLowerCase().includes(item.name.toLowerCase())
            return matchById || matchByName
          })
        })
      } else if (intent.action === 'clear') {
        cartUpdate = []
      }
    }

    return NextResponse.json({
      response,
      intent,
      cartUpdate,
    })
  } catch (error) {
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

