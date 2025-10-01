import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const sessionId = searchParams.get('sessionId')

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        const cart = await prisma.cart.findUnique({
            where: { sessionId },
        })

        if (!cart) {
            return NextResponse.json({ items: [] })
        }

        const items = JSON.parse(cart.items)
        return NextResponse.json({ items })
    } catch (error) {
        console.error('Failed to fetch cart:', error)
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, items } = body

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        const cart = await prisma.cart.upsert({
            where: { sessionId },
            update: {
                items: JSON.stringify(items),
                updatedAt: new Date(),
            },
            create: {
                sessionId,
                items: JSON.stringify(items),
            },
        })

        return NextResponse.json({ success: true, cart })
    } catch (error) {
        console.error('Failed to save cart:', error)
        return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
    }
}
