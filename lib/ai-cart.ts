import { CartItem } from '@/lib/types'

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

type MenuItemForIntent = {
  id: string
  name: string
  price: number
  image: string | null
  customizations?: MenuCustomization[]
}

type IntentItem = {
  menuItemId?: string
  name?: string
  quantity: number
  customizations?: Record<string, string | number | boolean>
}

type AIIntent =
  | { action: 'add'; items?: IntentItem[] }
  | { action: 'remove'; items?: IntentItem[] }
  | { action: 'modify'; items?: IntentItem[] }
  | { action: 'query'; items?: IntentItem[] }
  | { action: 'clear' }

function findMenuItem(menuItems: MenuItemForIntent[], item: IntentItem) {
  let menuItem = menuItems.find((menu) => menu.id === item.menuItemId)

  if (!menuItem && item.name) {
    const itemName = item.name.toLowerCase()
    menuItem = menuItems.find((menu) => {
      const menuName = menu.name.toLowerCase()
      return (
        menuName === itemName ||
        menuName.includes(itemName) ||
        itemName.includes(menuName)
      )
    })
  }

  return menuItem
}

function buildCustomizations(
  menuItem: MenuItemForIntent,
  customizations: IntentItem['customizations']
): Record<string, CustomizationEntry> {
  const processed: Record<string, CustomizationEntry> = {}

  if (customizations && typeof customizations === 'object') {
    for (const [key, value] of Object.entries(customizations)) {
      if (!value || typeof value === 'boolean') continue

      let matched = false
      const valLower = String(value).toLowerCase()
      const keyLower = String(key).toLowerCase()

      for (const option of menuItem.customizations ?? []) {
        const optionName = option.customizationItem.name.toLowerCase()
        const groupName = option.group.toLowerCase()

        const matchesValue =
          optionName.includes(valLower) || valLower.includes(optionName)
        const matchesGroup =
          groupName.includes(keyLower) || keyLower.includes(groupName)
        const matchesKeyAsOption =
          optionName.includes(keyLower) || keyLower.includes(optionName)

        if (
          matchesValue ||
          (matchesGroup && matchesValue) ||
          matchesKeyAsOption
        ) {
          processed[option.group] = {
            itemId: option.customizationItemId,
            name: option.customizationItem.name,
            price: option.customizationItem.price,
          }
          matched = true
          break
        }
      }

      if (!matched) {
        processed[key] = {
          itemId: `custom_${key}`,
          name: String(value),
          price: 0,
        }
      }
    }
  }

  const chickenTypeOptions = (menuItem.customizations ?? []).filter(
    (option) => option.group === 'Chicken Type'
  )
  if (chickenTypeOptions.length > 0 && !processed['Chicken Type']) {
    const regularOption = chickenTypeOptions.find((option) =>
      option.customizationItem.name.toLowerCase().includes('regular')
    )
    if (regularOption) {
      processed['Chicken Type'] = {
        itemId: regularOption.customizationItemId,
        name: regularOption.customizationItem.name,
        price: regularOption.customizationItem.price,
      }
    }
  }

  return processed
}

function cartItemKey(item: CartItem) {
  return `${item.menuItemId}:${JSON.stringify(item.customizations ?? {})}`
}

function buildCartItem(menuItem: MenuItemForIntent, item: IntentItem): CartItem {
  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    price: menuItem.price,
    quantity: item.quantity || 1,
    image: menuItem.image || null,
    customizations: buildCustomizations(menuItem, item.customizations),
  }
}

export function applyIntentToCart(
  currentCart: CartItem[],
  intent: AIIntent | null | undefined,
  menuItems: MenuItemForIntent[]
): { cartUpdate: CartItem[] | null; addedItems: CartItem[] } {
  if (!intent) {
    return { cartUpdate: null, addedItems: [] }
  }

  const workingCart = [...currentCart]
  const addedItems: CartItem[] = []

  if (intent.action === 'add' && intent.items?.length) {
    for (const item of intent.items) {
      const menuItem = findMenuItem(menuItems, item)
      if (!menuItem) continue

      const cartItem = buildCartItem(menuItem, item)
      addedItems.push(cartItem)

      const existingIndex = workingCart.findIndex(
        (existing) => cartItemKey(existing) === cartItemKey(cartItem)
      )

      if (existingIndex >= 0) {
        workingCart[existingIndex].quantity += cartItem.quantity
      } else {
        workingCart.push(cartItem)
      }
    }

    return { cartUpdate: workingCart, addedItems }
  }

  if (intent.action === 'remove' && intent.items?.length) {
    const cartUpdate = workingCart.filter((cartItem) => {
      return !intent.items?.some((item) => {
        const matchById =
          item.menuItemId && cartItem.menuItemId === item.menuItemId
        const matchByName =
          item.name &&
          cartItem.name.toLowerCase().includes(item.name.toLowerCase())
        return matchById || matchByName
      })
    })
    return { cartUpdate, addedItems }
  }

  if (intent.action === 'modify' && intent.items?.length) {
    for (const item of intent.items) {
      const existingIndex = workingCart.findIndex((cartItem) => {
        const matchById =
          item.menuItemId && cartItem.menuItemId === item.menuItemId
        const matchByName =
          item.name &&
          cartItem.name.toLowerCase().includes(item.name.toLowerCase())
        return matchById || matchByName
      })

      if (existingIndex >= 0) {
        if (item.quantity > 0) {
          workingCart[existingIndex].quantity = item.quantity
        } else {
          workingCart.splice(existingIndex, 1)
        }
      }
    }

    return { cartUpdate: workingCart, addedItems }
  }

  if (intent.action === 'clear') {
    return { cartUpdate: [], addedItems }
  }

  return { cartUpdate: null, addedItems }
}
