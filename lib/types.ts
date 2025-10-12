export interface Category {
    id: string
    name: string
    image: string | null
    sequence: number
}

export interface MenuItem {
    id: string
    name: string
    description: string | null
    price: number
    categoryId: string | null
    image: string | null
    available: boolean
    sequence: number
    customizations?: MenuItemCustomization[]
}

export interface CustomizationItem {
    id: string
    name: string
    description: string | null
    price: number
    image: string | null
    available: boolean
}

export interface MenuItemCustomization {
    id: string
    menuItemId: string
    customizationItemId: string
    group: string
    sequence: number
    customizationItem: CustomizationItem
}

export interface CartItem {
    menuItemId: string
    name: string
    price: number
    quantity: number
    image: string | null
    customizations?: {
        [key: string]: {
            itemId: string
            name: string
            price: number
        }
    }
}

export interface Order {
    id: string
    userId: string | null
    status: string
    total: number
    createdAt: Date
    items: OrderItem[]
}

export interface OrderItem {
    id: string
    orderId: string
    menuItemId: string
    quantity: number
    customizations: Record<string, unknown> | null
    price: number
}

export interface AIChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
    addedItems?: CartItem[]
}

export interface AIOrderIntent {
    action: 'add' | 'remove' | 'modify' | 'clear' | 'query'
    items?: {
        menuItemId?: string
        name: string
        quantity: number
        customizations?: {
            [key: string]: string | number
        }
    }[]
    query?: string
}
