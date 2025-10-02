import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    children: React.ReactNode
}

export default function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
        primary: 'bg-jollibee-red text-white hover:bg-red-700 active:bg-red-800',
        secondary: 'bg-jollibee-yellow text-jollibee-red hover:bg-yellow-400 active:bg-yellow-500',
        outline: 'border-2 border-jollibee-red text-jollibee-red hover:bg-jollibee-red hover:text-white',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    }

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    }

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}
