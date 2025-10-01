// @ts-nocheck
import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

async function main() {
    const menuPath = path.join(process.cwd(), 'jollibee_kiosk_menu.json')
    const raw = fs.readFileSync(menuPath, 'utf8')
    const menu = JSON.parse(raw) as {
        categories: {
            category_id: string
            category_name: string
            items: {
                item_id: string
                name: string
                description?: string
                base_price: number
                image?: string
                options?: string[]
            }[]
        }[]
        option_templates?: Record<
            string,
            {
                option_type: string
                option_name: string
                required: boolean
                choices: { name: string; price_modifier: number }[]
            }
        >
    }

    // Reset tables for deterministic seeding (SQLite-friendly)
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.customizationOption.deleteMany()
    await prisma.menuItem.deleteMany()
    await prisma.cart.deleteMany()

    const optionTemplates = menu.option_templates ?? {}

    let createdItems = 0
    let createdCustomizations = 0

    for (const category of menu.categories ?? []) {
        const categoryId = category.category_id
        const categoryName = category.category_name

        for (let idx = 0; idx < (category.items?.length ?? 0); idx++) {
            const item = category.items[idx]

            const created = await prisma.menuItem.create({
                data: {
                    sourceItemId: item.item_id ?? null,
                    sourceCategoryId: categoryId ?? null,
                    name: item.name,
                    description: item.description ?? null,
                    price: Number(item.base_price ?? 0),
                    category: categoryName,
                    image: item.image ?? null,
                    available: true,
                    customizations: {
                        create: (item.options ?? [])
                            .flatMap((templateName) => {
                                const t = optionTemplates[templateName]
                                if (!t || !Array.isArray(t.choices)) return []
                                return t.choices.map((choice) => ({
                                    type: t.option_type,
                                    name: choice.name,
                                    price: Number(choice.price_modifier ?? 0),
                                }))
                            }),
                    },
                },
            })

            createdItems++
            createdCustomizations += created.customizations?.length ?? 0
        }
    }

    console.log(`Seeded menu items: ${createdItems}`)
    console.log(`Seeded customization options: ${createdCustomizations}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
