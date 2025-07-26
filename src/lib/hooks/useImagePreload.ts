import { useEffect, useState } from 'react';
import { preloadImage } from '@/lib/image-loader';

/**
 * Hook to preload images for better performance
 * Useful for preloading images before they're needed
 */
export function useImagePreload(images: Array<{ src: string; sizes?: string }>) {
  useEffect(() => {
    images.forEach(({ src, sizes }) => {
      if (src) {
        preloadImage(src, sizes);
      }
    });
  }, [images]);
}

/**
 * Hook to preload NPC avatars when destination changes
 */
export function useNPCImagePreload(npcs: Array<{ imageUrl?: string }>) {
  const imagesToPreload = npcs
    .filter(npc => npc.imageUrl)
    .map(npc => ({
      src: npc.imageUrl!,
      sizes: '64px',
    }));
  
  useImagePreload(imagesToPreload);
}

/**
 * Hook to handle progressive image loading
 */
export function useProgressiveImage(lowQualitySrc: string, highQualitySrc: string) {
  const [src, setSrc] = useState(lowQualitySrc);
  
  useEffect(() => {
    setSrc(lowQualitySrc);
    
    const img = new Image();
    img.src = highQualitySrc;
    img.onload = () => {
      setSrc(highQualitySrc);
    };
  }, [lowQualitySrc, highQualitySrc]);
  
  return src;
}