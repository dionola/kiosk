'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Category, MenuItem, CartItem } from '@/lib/types'
import ItemCustomizer from './ItemCustomizer'
import LoadingImage from '@/components/ui/LoadingImage'

interface MenuDisplayProps {
    onAddToCart: (item: CartItem) => void
}

export default function MenuDisplay({ onAddToCart }: MenuDisplayProps) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

    const itemsContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadMenuData()
    }, [])

    useEffect(() => {
        if (itemsContainerRef.current) {
            itemsContainerRef.current.scrollTo(0, 0)
        }
    }, [selectedCategoryId])

    const loadMenuData = async () => {
        try {
            setLoadingProgress(10)

            const categoriesPromise = fetch('/api/categories')
            const menuPromise = fetch('/api/menu')

            const catRes = await categoriesPromise
            setLoadingProgress(35)

            const itemRes = await menuPromise
            setLoadingProgress(60)

            if (catRes.ok && itemRes.ok) {
                const cats = await catRes.json()
                setLoadingProgress(78)

                const items = await itemRes.json()
                setLoadingProgress(92)

                setCategories(cats)
                setMenuItems(items)

                if (cats.length > 0) {
                    setSelectedCategoryId(cats[0].id)
                }

                setLoadingProgress(100)
            }
        } catch (error) {
            console.error('Failed to load menu data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = useMemo(() => {
        if (!selectedCategoryId) return menuItems
        return menuItems.filter(item => item.categoryId === selectedCategoryId)
    }, [menuItems, selectedCategoryId])

    const selectedCategoryName = useMemo(() => {
        return categories.find(c => c.id === selectedCategoryId)?.name || 'Menu'
    }, [categories, selectedCategoryId])


    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white via-red-50 to-yellow-50 px-6">
                <div className="w-full max-w-xl rounded-[2rem] border border-red-100 bg-white/90 p-8 shadow-xl">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.24em] text-jollibee-red">
                                Preparing Menu
                            </p>
                            <h2 className="mt-2 text-3xl font-black text-red-800">
                                Loading Jollibee favorites...
                            </h2>
                        </div>
                        <div className="shrink-0 rounded-full bg-red-50 px-4 py-2 text-2xl font-black text-jollibee-red">
                            {loadingProgress}%
                        </div>
                    </div>

                    <div className="mt-6 h-5 overflow-hidden rounded-full bg-red-100">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-jollibee-red via-red-500 to-jollibee-yellow transition-all duration-500"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        <span>Categories</span>
                        <span>Menu Items</span>
                        <span>Ready</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex bg-gradient-to-br from-white via-red-50 to-yellow-50">
            {/* Category List - Left */}
            <aside className="w-32 sm:w-40 md:w-52 lg:w-56 xl:w-64 border-r border-red-100 bg-white/80">
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-3 pb-4 pt-4">
                        {categories.map((category) => {
                            const isActive = selectedCategoryId === category.id

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategoryId(category.id)}
                                    className={`w-full rounded-2xl overflow-hidden text-left shadow-sm transition-all ${isActive
                                        ? 'ring-2 ring-jollibee-red ring-offset-2 ring-offset-white scale-[1.02]'
                                        : 'hover:shadow-md hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className="relative aspect-square bg-gradient-to-br from-red-100 to-yellow-100">
                                        {category.image ? (
                                            <LoadingImage
                                                src={category.image}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                                fallback={<span className="text-4xl">🍽️</span>}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                                🍽️
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                            <p className="text-xs font-semibold text-white drop-shadow">
                                                {category.name}
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
                                {selectedCategoryName}
                            </h1>
                        </div>
                    </header>

                    <div
                        ref={itemsContainerRef}
                        className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white/90 border border-red-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col group"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-red-50 to-yellow-50">
                                        {item.image ? (
                                            <LoadingImage
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                fallback={<span className="text-4xl">🍗</span>}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-4xl"></span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                    </div>
                                    <div className="p-2 md:p-3 flex-1 flex flex-col justify-between">
                                        <h3 className="text-[12px] md:text-sm font-bold text-gray-900 line-clamp-2 mb-1 leading-tight">
                                            {item.name}
                                        </h3>
                                        <div className="mt-1">
                                            <span className="text-sm md:text-base font-extrabold text-jollibee-red">
                                                ₱{item.price.toFixed(0)}
                                            </span>
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
