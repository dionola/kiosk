import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseStoredCartItems, saveCartSchema } from '@/lib/schemas'
import { ZodError } from 'zod'

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

        const items = parseStoredCartItems(cart.items)
        return NextResponse.json({ items })
    } catch (error) {
        if (error instanceof SyntaxError || error instanceof ZodError) {
            console.error('Stored cart data is invalid:', error)
            return NextResponse.json({ error: 'Stored cart data is invalid' }, { status: 500 })
        }

        console.error('Failed to fetch cart:', error)
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { sessionId, items } = saveCartSchema.parse(await request.json())

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
        if (error instanceof ZodError) {
            return NextResponse.json({ error: 'Invalid cart payload' }, { status: 400 })
        }

        console.error('Failed to save cart:', error)
        return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
    }
}
