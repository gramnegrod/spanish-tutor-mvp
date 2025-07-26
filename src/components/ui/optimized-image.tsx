import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallbackSrc?: string;
  aspectRatio?: number;
  showSkeleton?: boolean;
}

/**
 * Optimized image component with:
 * - Automatic lazy loading
 * - Blur placeholder support
 * - Error handling with fallback
 * - Skeleton loading state
 * - Responsive sizing
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  className,
  aspectRatio,
  showSkeleton = true,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };
  
  // Calculate aspect ratio styles if provided
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio: aspectRatio.toString() }
    : undefined;
  
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={aspectRatioStyle}
    >
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}

// Preset image components for common use cases
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      {...props}
    />
  );
}

export function HeroImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      sizes="100vw"
      priority
      className={cn('object-cover', className)}
      {...props}
    />
  );
}

export function CardImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={cn('object-cover', className)}
      {...props}
    />
  );
}