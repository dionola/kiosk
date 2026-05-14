import { z } from 'zod'

export const customizationSelectionSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  price: z.number().finite(),
})

export const cartItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  price: z.number().finite().nonnegative(),
  quantity: z.number().int().positive(),
  image: z.string().nullable(),
  customizations: z.record(z.string(), customizationSelectionSchema).optional(),
})

export const cartItemsSchema = z.array(cartItemSchema)

export const saveCartSchema = z.object({
  sessionId: z.string().min(1),
  items: cartItemsSchema,
})

export const createOrderSchema = z.object({
  items: cartItemsSchema.nonempty(),
  userId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
})

export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  addedItems: cartItemsSchema.optional(),
})

export const aiChatRequestSchema = z.object({
  message: z.string().min(1),
  chatHistory: z.array(aiChatMessageSchema).optional().default([]),
  cart: cartItemsSchema.optional().default([]),
})

const intentItemSchema = z.object({
  menuItemId: z.string().optional(),
  name: z.string().optional(),
  quantity: z.number().int().default(1),
  customizations: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
})

export const aiToolArgsSchema = z.object({
  items: z.array(intentItemSchema).optional().default([]),
})

export function parseStoredCartItems(value: string) {
  return cartItemsSchema.parse(JSON.parse(value))
}
