'use client'

import { useState, useMemo } from 'react'
import { MenuItem, MenuItemCustomization, CustomizationItem, CartItem } from '@/lib/types'

interface ItemCustomizerProps {
    item: MenuItem
    initialCartItem?: CartItem // New prop for editing
    onAddToCart: (cartItem: CartItem) => void
    onClose: () => void
}

export default function ItemCustomizer({
    item,
    initialCartItem,
    onAddToCart,
    onClose,
}: ItemCustomizerProps) {
    const [quantity, setQuantity] = useState(initialCartItem?.quantity || 1)

    const isChickenjoy = item.name.toLowerCase().includes('chickenjoy')
    const piecesMatch = item.name.match(/(\d+)\s*-?\s*pc\./i)
    const totalPieces = piecesMatch ? parseInt(piecesMatch[1], 10) : (isChickenjoy ? 1 : 0)

    const [spicyPieces, setSpicyPieces] = useState(() => {
        if (initialCartItem && initialCartItem.customizations && initialCartItem.customizations['Spiciness']) {
            const match = initialCartItem.customizations['Spiciness'].name.match(/(\d+)\s*Spicy/i)
            return match ? parseInt(match[1], 10) : 0
        }
        return 0
    })

    // key is the group name (e.g., "Drink"), value is the selected customization item
    const [selectedCustomizations, setSelectedCustomizations] = useState<{
        [group: string]: {
            itemId: string
            name: string
            price: number
        }
    }>(() => {
        if (initialCartItem && initialCartItem.customizations) {
            return { ...initialCartItem.customizations }
        }

        const initial: { [group: string]: { itemId: string; name: string; price: number } } = {}
        if (item.customizations) {
            item.customizations.forEach(map => {
                const cItem = map.customizationItem
                // Default to Regular Chickenjoy
                if (cItem.name === 'Regular Chickenjoy') {
                    initial[map.group] = {
                        itemId: cItem.id,
                        name: cItem.name,
                        price: cItem.price
                    }
                }
            })
        }
        return initial
    })

    const handleCustomizationChange = (
        group: string,
        customItem: CustomizationItem,
        isRequired: boolean
    ) => {
        setSelectedCustomizations((prev) => {
            const newCustoms = { ...prev }

            // If it's already selected and NOT required, we can toggle it off
            if (newCustoms[group]?.itemId === customItem.id && !isRequired) {
                delete newCustoms[group]
            } else {
                newCustoms[group] = {
                    itemId: customItem.id,
                    name: customItem.name,
                    price: customItem.price
                }
            }
            return newCustoms
        })
    }

    const calculateTotal = () => {
        let baseTotal = item.price
        const customizationTotal = Object.values(selectedCustomizations).reduce(
            (sum, custom) => sum + custom.price,
            0
        )
        return (baseTotal + customizationTotal) * quantity
    }

    const handleAddToCart = () => {
        const finalCustomizations = { ...selectedCustomizations }
        if (isChickenjoy && totalPieces > 1) {
            finalCustomizations['Spiciness'] = {
                itemId: 'spicy_split',
                name: `${spicyPieces} Spicy, ${totalPieces - spicyPieces} Regular`,
                price: 0
            }
        }

        const cartItem: CartItem = {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity,
            image: item.image,
            customizations: finalCustomizations,
        }
        onAddToCart(cartItem)
        onClose()
    }

    // Group customizations by the 'group' field
    const customizationsByGroup = useMemo(() => {
        if (!item.customizations) return {}
        return item.customizations.reduce((acc, map) => {
            const group = map.group
            if (!acc[group]) acc[group] = []
            acc[group].push(map)
            return acc
        }, {} as Record<string, MenuItemCustomization[]>)
    }, [item.customizations])

    const getOptionIcon = (group: string) => {
        const lower = group.toLowerCase()
        if (lower.includes('drink')) return '🥤'
        if (lower.includes('fries') || lower.includes('side')) return '🍟'
        if (lower.includes('chicken')) return '🍗'
        if (lower.includes('size')) return '📏'
        return '➕'
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-red-50 to-white">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{item.name}</h2>
                        <p className="text-jollibee-red font-bold text-lg">₱{item.price.toFixed(0)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-jollibee-red hover:text-white transition-all shadow-sm"
                    >
                        <span className="text-2xl leading-none">×</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        {item.image && (
                            <div className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden shadow-md">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {item.description || 'Experience the joy of our world-famous Jollibee flavors, crafted with passion and served with a smile.'}
                            </p>

                            {/* Quantity Selector */}
                            <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                                <span className="font-bold text-gray-700">Quantity</span>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center text-xl font-bold hover:bg-gray-100 active:scale-95 transition-all"
                                    >
                                        −
                                    </button>
                                    <span className="text-2xl font-black w-8 text-center text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-xl bg-jollibee-red shadow-md flex items-center justify-center text-white text-xl font-bold hover:bg-red-600 active:scale-95 transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chickenjoy Piece Spiciness Slider */}
                    {isChickenjoy && totalPieces > 1 && (
                        <div className="mb-8 p-6 bg-red-50 rounded-2xl border-2 border-red-100">
                            <h3 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tight flex items-center gap-2">
                                🌶️ Spiciness Level
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 font-medium">Customize how many pieces are Spicy vs Regular in your {totalPieces}-pc meal.</p>

                            <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-red-100">
                                <div className="flex-1 text-center font-bold text-gray-700">
                                    <span className="text-2xl text-jollibee-red mr-1">{totalPieces - spicyPieces}</span>
                                    <span className="text-sm uppercase tracking-wider">Regular</span>
                                </div>
                                <div className="flex-2 w-full px-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max={totalPieces}
                                        value={spicyPieces}
                                        onChange={(e) => setSpicyPieces(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-1">
                                        <span>All Regular</span>
                                        <span>All Spicy</span>
                                    </div>
                                </div>
                                <div className="flex-1 text-center font-bold text-gray-700">
                                    <span className="text-2xl text-red-600 mr-1">{spicyPieces}</span>
                                    <span className="text-sm border border-red-200 bg-red-50 text-red-600 px-2 py-0.5 rounded uppercase tracking-wider">Spicy</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customizations */}
                    <div className="space-y-8">
                        {Object.entries(customizationsByGroup).map(([group, maps]) => (
                            <div key={group} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{getOptionIcon(group)}</span>
                                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-wider">
                                        {group}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {maps.map((map) => {
                                        const customItem = map.customizationItem
                                        const isSelected = selectedCustomizations[group]?.itemId === customItem.id

                                        return (
                                            <button
                                                key={map.id}
                                                onClick={() => handleCustomizationChange(group, customItem, false)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isSelected
                                                    ? 'border-jollibee-red bg-red-50 ring-1 ring-jollibee-red shadow-md'
                                                    : 'border-gray-100 hover:border-red-200 bg-white shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${isSelected ? 'text-jollibee-red' : 'text-gray-800'}`}>
                                                        {customItem.name}
                                                    </span>
                                                    {customItem.price > 0 ? (
                                                        <span className="text-sm font-semibold text-gray-500">
                                                            +₱{customItem.price.toFixed(0)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-green-600">
                                                            ₱0
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="w-6 h-6 rounded-full bg-jollibee-red flex items-center justify-center text-white text-xs">
                                                        ✓
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer - Total and Add Button */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-500 uppercase">Total Amount</span>
                            <span className="text-3xl font-black text-jollibee-red leading-none">
                                ₱{calculateTotal().toFixed(0)}
                            </span>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="px-10 py-4 bg-jollibee-red text-white rounded-2xl hover:bg-red-600 active:scale-[0.98] transition-all font-black text-xl shadow-lg shadow-red-200"
                        >
                            {initialCartItem ? 'Update Cart' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
