export interface MenuItem {
    id: string
    name: string
    description: string | null
    price: number
    category: string
    image: string | null
    available: boolean
    customizations?: CustomizationOption[]
}

export interface CustomizationOption {
    id: string
    menuItemId: string
    type: 'size' | 'addon' | 'modification' | 'drink' | 'fries' | 'chicken_type'
    name: string
    price: number
}

export interface CartItem {
    menuItemId: string
    name: string
    price: number
    quantity: number
    customizations?: {
        [key: string]: string | number
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
    customizations: any
    price: number
}

export interface AIChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
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
