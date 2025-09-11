'use client'

import Image, { ImageProps } from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  alt: string // Make alt required for accessibility
  loading?: 'lazy' | 'eager'
  priority?: boolean
  fallbackSrc?: string
  aspectRatio?: 'square' | '4:3' | '16:9' | '3:2' | '2:1' | number
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  className?: string
  containerClassName?: string
  showPlaceholder?: boolean
  placeholderColor?: string
  testId?: string
  onLoadingComplete?: () => void
  onError?: () => void
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  priority = false,
  fallbackSrc = '/images/placeholder.jpg',
  aspectRatio,
  objectFit = 'cover',
  className,
  containerClassName,
  showPlaceholder = true,
  placeholderColor = 'bg-gray-200',
  testId,
  onLoadingComplete,
  onError,
  ...props
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imageRef = useRef<HTMLImageElement>(null)

  // Handle aspect ratio
  const getAspectRatioClass = () => {
    if (!aspectRatio) return ''
    
    if (typeof aspectRatio === 'number') {
      return ''
    }
    
    const ratioMap = {
      'square': 'aspect-square',
      '4:3': 'aspect-[4/3]',
      '16:9': 'aspect-video',
      '3:2': 'aspect-[3/2]',
      '2:1': 'aspect-[2/1]'
    }
    
    return ratioMap[aspectRatio] || ''
  }

  // Generate responsive sizes based on common breakpoints
  const generateSizes = (width?: number | string) => {
    if (typeof width === 'number') {
      return `(max-width: 640px) ${Math.min(width, 640)}px, (max-width: 1024px) ${Math.min(width, 768)}px, ${width}px`
    }
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  }

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false)
    onLoadingComplete?.()
  }

  // Handle image error
  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
      setIsLoading(true)
    } else {
      onError?.()
    }
  }

  // Intersection Observer for lazy loading optimization
  useEffect(() => {
    if (priority || loading === 'eager') return

    const image = imageRef.current
    if (!image || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload image when it's about to enter viewport
            const link = document.createElement('link')
            link.rel = 'preload'
            link.as = 'image'
            link.href = typeof currentSrc === 'string' ? currentSrc : ''
            document.head.appendChild(link)
            observer.unobserve(image)
          }
        })
      },
      { rootMargin: '50px' }
    )

    observer.observe(image)
    return () => observer.disconnect()
  }, [currentSrc, priority, loading])

  // Placeholder component
  const Placeholder = () => (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        placeholderColor,
        'animate-pulse'
      )}
      aria-hidden="true"
    >
      <svg
        className="w-8 h-8 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        getAspectRatioClass(),
        containerClassName
      )}
      data-testid={testId}
    >
      {/* Placeholder */}
      {showPlaceholder && isLoading && <Placeholder />}
      
      {/* Error state */}
      {hasError && currentSrc === fallbackSrc && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-gray-100 text-gray-400'
          )}
          role="img"
          aria-label={`Failed to load image: ${alt}`}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 0a4 4 0 01-4-4V6a2 2 0 012-2h12a2 2 0 012 2v2a4 4 0 01-4 4m-6 0v4a2 2 0 002 2h2a2 2 0 002-2v-4m-6 0H9m6 0h-6"
            />
          </svg>
        </div>
      )}
      
      {/* Actual image */}
      <Image
        ref={imageRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        priority={priority}
        sizes={props.sizes || generateSizes(width)}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
}

// Gallery component with optimized loading
export interface ImageGalleryProps {
  images: Array<{
    src: string
    alt: string
    caption?: string
    width?: number
    height?: number
  }>
  columns?: number
  gap?: number
  aspectRatio?: OptimizedImageProps['aspectRatio']
  className?: string
  testId?: string
}

const ImageGallery = ({
  images,
  columns = 3,
  gap = 4,
  aspectRatio = 'square',
  className,
  testId
}: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  return (
    <>
      <div
        className={cn(
          `grid gap-${gap}`,
          `grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns}`,
          className
        )}
        data-testid={testId}
        role="region"
        aria-label="Image gallery"
      >
        {images.map((image, index) => (
          <button
            key={index}
            className="group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg overflow-hidden"
            onClick={() => setSelectedImage(index)}
            aria-label={`View ${image.alt} in full size`}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width={image.width || 400}
              height={image.height || 400}
              aspectRatio={aspectRatio}
              className="group-hover:scale-105 transition-transform duration-200"
              loading={index < 6 ? 'eager' : 'lazy'} // Load first 6 images eagerly
              priority={index < 3} // Prioritize first 3 images
            />
            {image.caption && (
              <div className="p-2 text-sm text-gray-600 bg-white">
                {image.caption}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox for selected image */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image viewer"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <OptimizedImage
            src={images[selectedImage].src}
            alt={images[selectedImage].alt}
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain"
            loading="eager"
            priority
          />
        </div>
      )}
    </>
  )
}

OptimizedImage.displayName = 'OptimizedImage'

export { OptimizedImage, ImageGallery }