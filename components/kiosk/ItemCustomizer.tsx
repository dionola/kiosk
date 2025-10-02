'use client'

import { useState } from 'react'
import { MenuItem, CustomizationOption, CartItem } from '@/lib/types'

interface ItemCustomizerProps {
    item: MenuItem
    onAddToCart: (cartItem: CartItem) => void
    onClose: () => void
}

export default function ItemCustomizer({
    item,
    onAddToCart,
    onClose,
}: ItemCustomizerProps) {
    const [quantity, setQuantity] = useState(1)
    const [selectedCustomizations, setSelectedCustomizations] = useState<{
        [key: string]: string | number
    }>({})

    const handleCustomizationChange = (
        type: string,
        name: string,
        price: number
    ) => {
        setSelectedCustomizations((prev) => {
            const newCustomizations = { ...prev }
            if (type === 'size') {
                // Only one size can be selected
                Object.keys(newCustomizations).forEach((key) => {
                    if (key.startsWith('size_')) {
                        delete newCustomizations[key]
                    }
                })
                newCustomizations[`size_${name}`] = name
            } else {
                // Toggle addons/modifications
                const key = `${type}_${name}`
                if (newCustomizations[key]) {
                    delete newCustomizations[key]
                } else {
                    newCustomizations[key] = name
                }
            }
            return newCustomizations
        })
    }

    const calculateTotal = () => {
        let total = item.price * quantity
        item.customizations?.forEach((custom) => {
            if (selectedCustomizations[`${custom.type}_${custom.name}`]) {
                total += custom.price * quantity
            }
        })
        return total
    }

    const handleAddToCart = () => {
        const cartItem: CartItem = {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity,
            customizations: selectedCustomizations,
        }
        onAddToCart(cartItem)
        onClose()
    }

    const customizationsByType = item.customizations?.reduce((acc, custom) => {
        if (!acc[custom.type]) {
            acc[custom.type] = []
        }
        acc[custom.type].push(custom)
        return acc
    }, {} as Record<string, CustomizationOption[]>) || {}

    const getOptionIcon = (option: CustomizationOption) => {
        if (option.type === 'drink') return '🥤'
        if (option.type === 'fries') return '🍟'
        if (option.type === 'chicken_type') return '🍗'
        if (option.type === 'size') return '📏'
        if (option.type === 'addon') return '➕'
        if (option.type === 'modification') return '⚙️'
        return '🍽️'
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-3xl font-bold text-gray-800">{item.name}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {item.image && (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-64 object-cover rounded-lg mb-4"
                        />
                    )}

                    <p className="text-gray-600 mb-6">{item.description || 'Delicious Jollibee favorite'}</p>

                    {/* Quantity Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                        </label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                            >
                                −
                            </button>
                            <span className="text-2xl font-semibold w-12 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Customizations */}
                    {Object.keys(customizationsByType).length > 0 && (
                        <div className="space-y-6 mb-6">
                            {Object.entries(customizationsByType).map(([type, options]) => (
                                <div key={type}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                                        {type}
                                    </label>
                                    <div className="space-y-2">
                                        {options.map((option) => {
                                            const key = `${option.type}_${option.name}`
                                            const isSelected = !!selectedCustomizations[key]
                                            const isSize = option.type === 'size'

                                            return (
                                                <label
                                                    key={option.id}
                                                    className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${isSelected
                                                            ? 'border-jollibee-red bg-red-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center">
                                                        <input
                                                            type={isSize ? 'radio' : 'checkbox'}
                                                            name={isSize ? type : undefined}
                                                            checked={isSelected}
                                                            onChange={() =>
                                                                handleCustomizationChange(
                                                                    option.type,
                                                                    option.name,
                                                                    option.price
                                                                )
                                                            }
                                                            className="mr-3"
                                                        />
                                                        <span className="mr-2 text-xl">{getOptionIcon(option)}</span>
                                                        <span className="font-medium">{option.name}</span>
                                                    </div>
                                                    {option.price > 0 && (
                                                        <span className="text-jollibee-red font-semibold">
                                                            +₱{option.price.toFixed(0)}
                                                        </span>
                                                    )}
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total and Add Button */}
                    <div className="border-t-2 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xl font-semibold text-gray-800">Total:</span>
                            <span className="text-3xl font-bold text-jollibee-red">
                                ₱{calculateTotal().toFixed(0)}
                            </span>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="w-full py-4 bg-jollibee-red text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
