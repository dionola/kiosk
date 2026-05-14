'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface LoadingImageProps {
  src?: string | null
  alt: string
  className?: string
  skeletonClassName?: string
  fallback?: React.ReactNode
}

export default function LoadingImage({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  fallback,
}: LoadingImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [src])

  if (!src || hasError) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${skeletonClassName}`}>
        {fallback ?? <span className="text-4xl">🍽️</span>}
      </div>
    )
  }

  return (
    <>
      {!isLoaded && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 animate-pulse bg-gradient-to-br from-red-100 via-white to-yellow-100 ${skeletonClassName}`}
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 20vw"
        unoptimized
        className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </>
  )
}
