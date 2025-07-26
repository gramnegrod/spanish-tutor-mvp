/**
 * Custom image loader for Next.js Image component
 * Handles external images and optimization
 */

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

// Image optimization service URLs (you can use Cloudinary, Imgix, etc.)
const IMAGE_OPTIMIZATION_DOMAINS = {
  cloudinary: 'https://res.cloudinary.com',
  unsplash: 'https://images.unsplash.com',
  pexels: 'https://images.pexels.com',
};

/**
 * Custom loader for external images
 * This example uses Cloudinary-style transformations
 */
export function imageLoader({ src, width, quality }: ImageLoaderProps) {
  // If it's already an absolute URL, check if it needs optimization
  if (src.startsWith('http')) {
    // For demonstration - you would implement actual CDN transformation here
    const url = new URL(src);
    
    // Example: Cloudinary transformation
    if (url.hostname.includes('cloudinary.com')) {
      const parts = url.pathname.split('/');
      const uploadIndex = parts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
        const transformation = `w_${width},q_${quality || 75},f_auto`;
        parts.splice(uploadIndex + 1, 0, transformation);
        return `${url.origin}${parts.join('/')}`;
      }
    }
    
    // For other external images, return as-is
    // In production, you might proxy through your own image service
    return src;
  }
  
  // For local images, use Next.js default optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}

/**
 * Generate blur placeholder data URL
 */
export async function getBlurDataURL(src: string): Promise<string> {
  // In a real app, you'd generate this during build time
  // This is a placeholder implementation
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="20%" />
          <stop stop-color="#edeef1" offset="50%" />
          <stop stop-color="#f6f7f8" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f6f7f8" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>`;

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(shimmer(10, 10))}`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, sizes?: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  if (sizes) {
    link.setAttribute('imagesizes', sizes);
  }
  document.head.appendChild(link);
}

/**
 * Generate responsive image sizes
 */
export function generateImageSizes(config: {
  mobile: string;
  tablet: string;
  desktop: string;
}) {
  return `(max-width: 640px) ${config.mobile}, (max-width: 1024px) ${config.tablet}, ${config.desktop}`;
}

// Common size presets
export const imageSizes = {
  avatar: generateImageSizes({ mobile: '64px', tablet: '64px', desktop: '64px' }),
  thumbnail: generateImageSizes({ mobile: '100vw', tablet: '50vw', desktop: '25vw' }),
  card: generateImageSizes({ mobile: '100vw', tablet: '50vw', desktop: '33vw' }),
  hero: generateImageSizes({ mobile: '100vw', tablet: '100vw', desktop: '100vw' }),
  content: generateImageSizes({ mobile: '100vw', tablet: '80vw', desktop: '60vw' }),
};