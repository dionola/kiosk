'use client'

import { useState, useEffect, useMemo } from 'react'
import { MenuItem, CartItem } from '@/lib/types'
import ItemCustomizer from './ItemCustomizer'

interface MenuDisplayProps {
    onAddToCart: (item: CartItem) => void
}

export default function MenuDisplay({ onAddToCart }: MenuDisplayProps) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

    useEffect(() => {
        loadMenuItems()
    }, [])

    const loadMenuItems = async () => {
        try {
            const response = await fetch('/api/menu')
            if (response.ok) {
                const data = await response.json()
                setMenuItems(data)
            }
        } catch (error) {
            console.error('Failed to load menu:', error)
        } finally {
            setLoading(false)
        }
    }

    const categories = useMemo(() => {
        const unique = Array.from(new Set(menuItems.map((item) => item.category))).sort()
        return unique
    }, [menuItems])

    useEffect(() => {
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0])
        }
    }, [categories, selectedCategory])

    const filteredItems =
        selectedCategory && selectedCategory.length > 0
            ? menuItems.filter((item) => item.category === selectedCategory)
            : menuItems

    const handleAddToCart = (item: MenuItem) => {
        // If item has customizations, show customizer, otherwise add directly
        if (item.customizations && item.customizations.length > 0) {
            setSelectedItem(item)
        } else {
            const cartItem: CartItem = {
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
            }
            onAddToCart(cartItem)
        }
    }

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-xl">Loading menu...</p>
            </div>
        )
    }

    return (
        <div className="h-full flex bg-gradient-to-br from-white via-red-50 to-yellow-50">
            {/* Category List - Left */}
            <aside className="w-32 sm:w-40 md:w-52 lg:w-56 xl:w-64 border-r border-red-100 bg-white/80">
                <div className="h-full flex flex-col">
                    <div className="px-3 pt-4 pb-2">
                        <h2 className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                            Categories
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-3 pb-4">
                        {categories.map((category) => {
                            const isActive = selectedCategory === category
                            const firstItem = menuItems.find((i) => i.category === category)

                            return (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`w-full rounded-2xl overflow-hidden text-left shadow-sm transition-all ${isActive
                                            ? 'ring-2 ring-jollibee-red ring-offset-2 ring-offset-white scale-[1.02]'
                                            : 'hover:shadow-md hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className="relative aspect-square bg-gradient-to-br from-red-100 to-yellow-100">
                                        {firstItem?.image ? (
                                            <img
                                                src={firstItem.image}
                                                alt={category}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                🍽️
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                            <p className="text-xs font-semibold text-white drop-shadow">
                                                {category}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* Items Grid - Right */}
            <section className="flex-1 h-full overflow-hidden">
                <div className="h-full flex flex-col">
                    <header className="px-4 pt-4 pb-2 flex items-baseline justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-red-800 drop-shadow-sm">
                                {selectedCategory || 'Menu'}
                            </h1>
                            <p className="text-xs md:text-sm text-red-700/80">
                                Touch a category on the left, then tap an item to customize and add to your tray.
                            </p>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white/90 border border-red-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-40 md:h-44 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-40 md:h-44 bg-gradient-to-br from-jollibee-yellow to-jollibee-red flex items-center justify-center">
                                            <span className="text-5xl">🍔</span>
                                        </div>
                                    )}
                                    <div className="p-3 md:p-4 flex-1 flex flex-col">
                                        <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 line-clamp-2">
                                            {item.name}
                                        </h3>
                                        <p className="text-[11px] md:text-xs text-gray-600 mb-2 md:mb-3 line-clamp-2">
                                            {item.description || 'Delicious Jollibee favorite'}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between gap-2">
                                            <span className="text-lg md:text-xl font-extrabold text-jollibee-red">
                                                ₱{item.price.toFixed(0)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleAddToCart(item)
                                                }}
                                                className="px-3 md:px-4 py-1.5 md:py-2 bg-jollibee-red text-white rounded-full hover:bg-red-700 transition-colors text-xs md:text-sm font-semibold"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="flex items-center justify-center py-12">
                                <p className="text-lg text-gray-500">No items found in this category.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Item Customizer Modal */}
            {selectedItem && (
                <ItemCustomizer
                    item={selectedItem}
                    onAddToCart={onAddToCart}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    )
}
