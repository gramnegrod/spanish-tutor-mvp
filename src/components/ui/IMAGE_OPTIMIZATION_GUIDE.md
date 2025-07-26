# Image Optimization Guide

This guide explains how to use the optimized image components and features in this application.

## Components

### OptimizedImage
The base component for all optimized images:

```tsx
import { OptimizedImage } from '@/components/ui/optimized-image';

<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Load eagerly for above-the-fold images
/>
```

### AvatarImage
Pre-configured for user/NPC avatars:

```tsx
import { AvatarImage } from '@/components/ui/optimized-image';

<AvatarImage
  src={user.avatarUrl}
  alt={`${user.name} avatar`}
  size={48} // Size in pixels
/>
```

### HeroImage
Full-width hero images:

```tsx
import { HeroImage } from '@/components/ui/optimized-image';

<div className="relative h-[400px]">
  <HeroImage
    src="/images/mexico-city-hero.jpg"
    alt="Mexico City skyline"
  />
</div>
```

### CardImage
Images within cards:

```tsx
import { CardImage } from '@/components/ui/optimized-image';

<div className="relative aspect-video">
  <CardImage
    src={destination.imageUrl}
    alt={destination.name}
  />
</div>
```

## Features

### Automatic Optimizations
- **Lazy Loading**: Images load only when near viewport
- **Format Selection**: Serves WebP/AVIF when supported
- **Responsive Sizing**: Different sizes for different devices
- **Blur Placeholders**: Smooth loading experience

### Error Handling
All image components include automatic fallback:

```tsx
<OptimizedImage
  src={dynamicImageUrl}
  alt="Dynamic content"
  fallbackSrc="/images/placeholder.png"
  width={400}
  height={300}
/>
```

### External Images
Configure domains in `next.config.js`:

```js
images: {
  domains: ['images.unsplash.com', 'your-cdn.com'],
}
```

### Performance Tips

1. **Use Priority for Above-the-fold Images**:
   ```tsx
   <OptimizedImage priority ... />
   ```

2. **Set Proper Sizes**:
   ```tsx
   <OptimizedImage
     sizes="(max-width: 768px) 100vw, 50vw"
     ...
   />
   ```

3. **Preload Critical Images**:
   ```tsx
   import { preloadImage } from '@/lib/image-loader';
   
   useEffect(() => {
     preloadImage('/images/hero.jpg', '100vw');
   }, []);
   ```

## Migration from `<img>` tags

Replace standard img tags:

```tsx
// Before
<img src="/image.jpg" alt="Description" />

// After
<OptimizedImage
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
/>
```

For unknown dimensions, use fill:

```tsx
<div className="relative w-full h-64">
  <OptimizedImage
    src="/image.jpg"
    alt="Description"
    fill
    className="object-cover"
  />
</div>
```