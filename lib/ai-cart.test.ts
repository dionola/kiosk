import { describe, expect, it } from 'vitest'
import { applyIntentToCart } from '@/lib/ai-cart'
import { CartItem } from '@/lib/types'

const menuItems = [
  {
    id: '1',
    name: '1-pc Chickenjoy',
    price: 99,
    image: null,
    customizations: [
      {
        group: 'Chicken Type',
        customizationItemId: 'c1',
        customizationItem: { name: 'Regular Chickenjoy', price: 0 },
      },
      {
        group: 'Chicken Type',
        customizationItemId: 'c2',
        customizationItem: { name: 'Spicy Chickenjoy', price: 0 },
      },
    ],
  },
  {
    id: '2',
    name: 'Jolly Spaghetti',
    price: 75,
    image: null,
    customizations: [],
  },
]

describe('applyIntentToCart', () => {
  it('adds menu items and applies default chicken type customization', () => {
    const result = applyIntentToCart(
      [],
      {
        action: 'add',
        items: [{ name: '1-pc Chickenjoy', quantity: 2 }],
      },
      menuItems
    )

    expect(result.cartUpdate).toHaveLength(1)
    expect(result.addedItems[0].quantity).toBe(2)
    expect(result.addedItems[0].customizations?.['Chicken Type']?.name).toBe('Regular Chickenjoy')
  })

  it('merges matching added items into the same cart entry', () => {
    const currentCart: CartItem[] = [
      {
        menuItemId: '2',
        name: 'Jolly Spaghetti',
        price: 75,
        quantity: 1,
        image: null,
        customizations: {},
      },
    ]

    const result = applyIntentToCart(
      currentCart,
      {
        action: 'add',
        items: [{ menuItemId: '2', name: 'Jolly Spaghetti', quantity: 2 }],
      },
      menuItems
    )

    expect(result.cartUpdate).toHaveLength(1)
    expect(result.cartUpdate?.[0].quantity).toBe(3)
  })

  it('removes matching items by name', () => {
    const currentCart: CartItem[] = [
      {
        menuItemId: '1',
        name: '1-pc Chickenjoy',
        price: 99,
        quantity: 1,
        image: null,
        customizations: {},
      },
      {
        menuItemId: '2',
        name: 'Jolly Spaghetti',
        price: 75,
        quantity: 1,
        image: null,
        customizations: {},
      },
    ]

    const result = applyIntentToCart(
      currentCart,
      {
        action: 'remove',
        items: [{ name: 'Chickenjoy', quantity: 1 }],
      },
      menuItems
    )

    expect(result.cartUpdate).toHaveLength(1)
    expect(result.cartUpdate?.[0].name).toBe('Jolly Spaghetti')
  })
})
