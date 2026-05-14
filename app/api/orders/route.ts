import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CartItem } from '@/lib/types'
import { createOrderSchema } from '@/lib/schemas'
import { ZodError } from 'zod'

function getCustomizationTotal(item: CartItem) {
  return Object.values(item.customizations ?? {}).reduce((sum, custom) => sum + custom.price, 0)
}

export async function POST(request: NextRequest) {
  try {
    const { items, userId, sessionId } = createOrderSchema.parse(await request.json())

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: items.map((item) => item.menuItemId),
        },
      },
      include: {
        customizations: {
          include: {
            customizationItem: true,
          },
        },
      },
    })

    const menuById = new Map(menuItems.map((item) => [item.id, item]))

    if (menuById.size !== new Set(items.map((item) => item.menuItemId)).size) {
      return NextResponse.json(
        { error: 'One or more menu items are invalid' },
        { status: 400 }
      )
    }

    const normalizedItems = items.map((item) => {
      const menuItem = menuById.get(item.menuItemId)!
      const allowedCustomizations = new Map(
        menuItem.customizations.map((customization) => [
          customization.customizationItemId,
          customization.customizationItem,
        ])
      )
      const customizations = Object.fromEntries(
        Object.entries(item.customizations ?? {}).map(([group, customization]) => {
          if (customization.itemId === 'spicy_split' || customization.itemId.startsWith('custom_')) {
            return [group, { ...customization, price: 0 }]
          }

          const allowed = allowedCustomizations.get(customization.itemId)
          if (!allowed) {
            throw new Error(`Invalid customization ${customization.itemId}`)
          }

          return [
            group,
            {
              itemId: allowed.id,
              name: allowed.name,
              price: allowed.price,
            },
          ]
        })
      )

      return {
        ...item,
        name: menuItem.name,
        price: menuItem.price,
        customizations,
      }
    })

    const total = normalizedItems.reduce((sum: number, item: CartItem) => {
      return sum + (item.price + getCustomizationTotal(item)) * item.quantity
    }, 0)

    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        status: 'pending',
        total,
        items: {
          create: normalizedItems.map((item: CartItem) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            customizations: JSON.stringify(item.customizations || {}),
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    // Clear cart if sessionId provided
    if (sessionId) {
      await prisma.cart.deleteMany({
        where: { sessionId },
      })
    }

    return NextResponse.json({ order })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid order payload' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.startsWith('Invalid customization')) {
      return NextResponse.json(
        { error: 'One or more customizations are invalid' },
        { status: 400 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    const orders = await prisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}



