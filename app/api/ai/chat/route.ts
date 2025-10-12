import { NextRequest, NextResponse } from 'next/server'
import { processAIOrder } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { CartItem, AIChatMessage } from '@/lib/types'

type MenuCustomization = {
  group: string
  customizationItemId: string
  customizationItem: {
    name: string
    price: number
  }
}

type CustomizationEntry = {
  itemId: string
  name: string
  price: number
}

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
      cart || [],
      (chatHistory || []) as AIChatMessage[],
      menuString
    )

    // Handle intent if present
    let cartUpdate: CartItem[] | null = null
    let addedItems: CartItem[] = []

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
              mi.name.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(mi.name.toLowerCase())
            )
          }

          if (menuItem) {
            const processedCustomizations: Record<string, CustomizationEntry> = {}
            if (item.customizations && typeof item.customizations === 'object') {
              for (const [key, value] of Object.entries(item.customizations)) {
                // Ignore empty or boolean customizations (AI sometimes returns true as a placeholder)
                if (!value || typeof value === 'boolean') continue;

                let matched = false;
                if (menuItem.customizations) {
                  const valLower = String(value).toLowerCase()
                  const keyLower = String(key).toLowerCase()

                  // 1. Try matching value directly against customization item names
                  let match = (menuItem.customizations as MenuCustomization[]).find(c =>
                    c.customizationItem.name.toLowerCase().includes(valLower) ||
                    valLower.includes(c.customizationItem.name.toLowerCase())
                  )

                  // 2. If no match, try key as group name then value within that group
                  if (!match) {
                    const groupItems = (menuItem.customizations as MenuCustomization[]).filter(c =>
                      c.group.toLowerCase().includes(keyLower) ||
                      keyLower.includes(c.group.toLowerCase())
                    )
                    if (groupItems.length > 0) {
                      match = groupItems.find(c =>
                        c.customizationItem.name.toLowerCase().includes(valLower) ||
                        valLower.includes(c.customizationItem.name.toLowerCase())
                      )
                    }
                  }

                  // 3. Try matching key directly as a customization item name (key IS the option)
                  if (!match) {
                    match = (menuItem.customizations as any[]).find(c =>
                      c.customizationItem.name.toLowerCase().includes(keyLower) ||
                      keyLower.includes(c.customizationItem.name.toLowerCase())
                    )
                  }

                  if (match) {
                    processedCustomizations[match.group] = {
                      itemId: match.customizationItemId,
                      name: match.customizationItem.name,
                      price: match.customizationItem.price
                    }
                    matched = true;
                  }
                }

                if (!matched) {
                  processedCustomizations[key] = {
                    itemId: `custom_${key}`,
                    name: String(value),
                    price: 0
                  }
                }
              }
            }

            // Default Chicken Type to Regular if the item has that group and none was chosen
            if (menuItem.customizations) {
              const chickenTypeGroup = (menuItem.customizations as MenuCustomization[]).filter(
                c => c.group === 'Chicken Type'
              )
              if (chickenTypeGroup.length > 0 && !processedCustomizations['Chicken Type']) {
                const regularOption = chickenTypeGroup.find(
                  c => c.customizationItem.name.toLowerCase().includes('regular')
                )
                if (regularOption) {
                  processedCustomizations['Chicken Type'] = {
                    itemId: regularOption.customizationItemId,
                    name: regularOption.customizationItem.name,
                    price: regularOption.customizationItem.price
                  }
                }
              }
            }

            const cartItem: CartItem = {
              menuItemId: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              quantity: item.quantity || 1,
              image: menuItem.image || null,
              customizations: processedCustomizations,
            }
            addedItems.push(cartItem)
            const existingIndex = currentCart.findIndex(ci => ci.menuItemId === menuItem!.id && JSON.stringify(ci.customizations) === JSON.stringify(cartItem.customizations));
            if (existingIndex >= 0) {
              currentCart[existingIndex].quantity += cartItem.quantity;
            } else {
              currentCart.push(cartItem);
            }
          }
        }
        cartUpdate = currentCart
      } else if (intent.action === 'remove' && intent.items && intent.items.length > 0) {
        // Remove items from cart - match by name or ID
        cartUpdate = currentCart.filter((cartItem) => {
          return !intent!.items?.some(item => {
            const matchById = item.menuItemId && cartItem.menuItemId === item.menuItemId
            const matchByName = item.name && cartItem.name.toLowerCase().includes(item.name.toLowerCase())
            return matchById || matchByName
          })
        })
      } else if (intent.action === 'modify' && intent.items && intent.items.length > 0) {
        cartUpdate = [...currentCart]
        for (const item of intent.items) {
          const existingIndex = cartUpdate.findIndex(ci => {
            const matchById = item.menuItemId && ci.menuItemId === item.menuItemId
            const matchByName = item.name && ci.name.toLowerCase().includes(item.name.toLowerCase())
            return matchById || matchByName
          });
          if (existingIndex >= 0) {
            if (item.quantity > 0) {
              cartUpdate[existingIndex].quantity = item.quantity;
            } else {
              cartUpdate.splice(existingIndex, 1);
            }
          }
        }
      } else if (intent.action === 'clear') {
        cartUpdate = []
      }
    }

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

