import fs from 'node:fs'
import path from 'node:path'
import { createPrismaClient } from '../lib/db'

const prisma = createPrismaClient()

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
    await prisma.menuItemCustomization.deleteMany()
    await prisma.customizationItem.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.menuItem.deleteMany()
    await prisma.category.deleteMany()
    await prisma.cart.deleteMany()

    const optionTemplates = menu.option_templates ?? {}

    // 1. Create Categories
    console.log("Creating categories...")
    const categoryMap = new Map<string, string>() // sourceCategoryId -> dbId

    for (let i = 0; i < (menu.categories?.length ?? 0); i++) {
        const cat = menu.categories[i]
        const categoryImage = cat.items?.[0]?.image || null

        const createdCat = await prisma.category.create({
            data: {
                name: cat.category_name,
                image: categoryImage,
                sequence: i * 10,
            }
        })
        categoryMap.set(cat.category_id, createdCat.id)
    }

    // 2. Create Standalone CustomizationItems
    console.log("Creating customization items...")
    const customizationItemMap = new Map<string, string>() // choice name -> dbId

    for (const [templateId, template] of Object.entries(optionTemplates)) {
        for (const choice of template.choices) {
            if (choice.name === "No Drink" || choice.name === "No Fries") continue

            const cleanName = choice.name.replace(/\s*\(Included\)/g, '').trim()

            let customId: string
            if (customizationItemMap.has(cleanName)) {
                customId = customizationItemMap.get(cleanName)!
            } else {
                const created = await prisma.customizationItem.create({
                    data: {
                        name: cleanName,
                        price: Number(choice.price_modifier ?? 0),
                        available: true,
                        description: `Option for ${template.option_name || template.option_type}`,
                    }
                })
                customId = created.id
                customizationItemMap.set(cleanName, customId)
            }

            // Always map the original name to the ID so template lookups work
            if (choice.name !== cleanName) {
                customizationItemMap.set(choice.name, customId)
            }
        }
    }

    // 3. Create MenuItems and map them
    console.log("Creating menu items and mappings...")

    const seenNormalizedNames = new Set<string>()

    function shouldSkipItem(name: string): boolean {
        const n = name.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ')

        // Explicitly KEEP these categories/types
        if (n.includes("super meal") ||
            n.includes("bucket") ||
            n.includes("family meal") ||
            n.includes("kiddie meal") ||
            n.includes("bundle") ||
            n.includes("pan") ||
            n.includes("platter") ||
            n.includes("sharing") ||
            n.includes("perfect pair")) {
            return false;
        }

        const comboKeywords = [
            "with drink", "with fries", "with coke", "with iced tea",
            "with sprite", "with minute maid", "with pineapple juice",
            "with float", "with coffee", "w/ drink", "w/ fries",
            "w/ coke", "w/ iced tea", "w/ sprite", "w/ minute maid",
            "w/ pineapple juice", "w/ float", "w/ coffee",
            "& reg. fries", "& fries", "& drink", "plus drink",
            "with side", "w/ side"
        ]

        if (comboKeywords.some(kw => n.includes(kw))) {
            return true;
        }

        return false;
    }

    function normalizeForDedupe(name: string): string {
        return name.toLowerCase()
            .replace(/[–—]/g, '-')
            .replace(/[^a-z0-9]/g, '') // remove all punctuation and spaces
            .trim()
    }

    for (const cat of menu.categories ?? []) {
        const dbCategoryId = categoryMap.get(cat.category_id)

        for (let idx = 0; idx < (cat.items?.length ?? 0); idx++) {
            const item = cat.items[idx]

            if (shouldSkipItem(item.name)) {
                console.log(`[FILTER] Skipping combo: ${item.name}`)
                continue
            }

            const normalized = normalizeForDedupe(item.name)
            if (seenNormalizedNames.has(normalized)) {
                console.log(`[DEDUP] Skipping duplicate: ${item.name}`)
                continue
            }
            seenNormalizedNames.add(normalized)

            // Map customizations via MenuItemCustomization
            let itemOptions = item.options ? [...item.options] : []
            const lowerName = item.name.toLowerCase()

            const isFamilyOption = lowerName.includes("bucket") ||
                lowerName.includes("family") ||
                lowerName.includes("pan") ||
                lowerName.includes("box") ||
                lowerName.includes("sharing") ||
                lowerName.includes("savers") ||
                lowerName.includes("platter") ||
                lowerName.includes("bundle") ||
                lowerName.includes("party")

            const isBurgerSteak6pcPlus = (lowerName.includes("burger steak") &&
                (lowerName.includes("6-pc") || lowerName.includes("8-pc") || lowerName.includes("6 pc") || lowerName.includes("8 pc")))

            const isSuperMeal = lowerName.includes("super meal")
            const isKiddieMeal = lowerName.includes("kiddie meal") && (lowerName.includes("chickenjoy") || lowerName.includes("nugget"))

            let finalName = item.name

            if (isFamilyOption || isBurgerSteak6pcPlus) {
                // Remove drinks
                itemOptions = itemOptions.filter(o => o !== "drink" && o !== "drink_included")
                // Clean up name if it contains "with drink" or "& drink"
                finalName = finalName.replace(/\s*[&,]\s*drinks?/gi, '')
                    .replace(/\s*with\s*drinks?/gi, '')
                    .replace(/\s*w\/\s*drinks?/gi, '')
                    .trim()
            } else if (isSuperMeal || isKiddieMeal) {
                // For super meals and kiddie meals, ensure they have the included drink option
                // Remove existing drink options first to avoid duplicates or different types
                itemOptions = itemOptions.filter(o => o !== "drink" && o !== "drink_included")
                itemOptions.push("drink_included")
            }

            const createdItem = await prisma.menuItem.create({
                data: {
                    sourceItemId: item.item_id ?? null,
                    sourceCategoryId: cat.category_id ?? null,
                    name: finalName,
                    description: item.description ?? null,
                    price: Number(item.base_price ?? 0),
                    categoryId: dbCategoryId,
                    image: item.image ?? null,
                    available: true,
                    sequence: idx * 10,
                }
            })

            if (itemOptions.length > 0) {
                for (const templateId of itemOptions) {
                    const template = optionTemplates[templateId]
                    if (!template) continue

                    for (let cIdx = 0; cIdx < template.choices.length; cIdx++) {
                        const choice = template.choices[cIdx]
                        const customId = customizationItemMap.get(choice.name)
                        if (customId) {
                            await prisma.menuItemCustomization.create({
                                data: {
                                    menuItemId: createdItem.id,
                                    customizationItemId: customId,
                                    group: template.option_name || template.option_type,
                                    sequence: cIdx,
                                }
                            })
                        }
                    }
                }
            }
        }
    }

    console.log("Seeding complete!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
