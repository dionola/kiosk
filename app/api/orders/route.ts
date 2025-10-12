import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CartItem } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { items, userId, sessionId } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }

    // Calculate total
    const total = items.reduce((sum: number, item: CartItem) => {
      return sum + item.price * item.quantity
    }, 0)

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        status: 'pending',
        total,
        items: {
          create: items.map((item: CartItem) => ({
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



