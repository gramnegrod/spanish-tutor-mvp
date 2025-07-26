import { OptimizedImage, AvatarImage } from './optimized-image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NPCAvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

/**
 * NPC Avatar component with optimized image loading
 * Falls back to icon if no image is provided
 */
export function NPCAvatar({ 
  name, 
  imageUrl, 
  size = 'md',
  className 
}: NPCAvatarProps) {
  const pixelSize = sizeMap[size];
  
  if (!imageUrl) {
    // Fallback to icon
    return (
      <div 
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-200',
          size === 'sm' && 'w-8 h-8',
          size === 'md' && 'w-12 h-12',
          size === 'lg' && 'w-16 h-16',
          className
        )}
      >
        <User 
          className={cn(
            'text-gray-500',
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-6 h-6',
            size === 'lg' && 'w-8 h-8'
          )} 
        />
      </div>
    );
  }
  
  return (
    <AvatarImage
      src={imageUrl}
      alt={`${name} avatar`}
      size={pixelSize}
      className={className}
      fallbackSrc="/images/default-avatar.png"
    />
  );
}

/**
 * Example usage in NPC selection component
 */
export function NPCCard({
  npc,
  onClick,
  selected = false,
}: {
  npc: { id: string; name: string; role: string; imageUrl?: string };
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border-2 transition-all hover:shadow-md',
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-center gap-3">
        <NPCAvatar 
          name={npc.name} 
          imageUrl={npc.imageUrl} 
          size="md" 
        />
        <div className="text-left">
          <h3 className="font-semibold">{npc.name}</h3>
          <p className="text-sm text-gray-600">{npc.role}</p>
        </div>
      </div>
    </button>
  );
}