import useSWR, { mutate } from 'swr';
import { cacheKeys, invalidateCache } from '../swr-config';
import { createClient } from '@/utils/supabase/client';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  spanish_level?: 'beginner' | 'intermediate' | 'advanced';
  learning_goals?: string[];
  preferred_topics?: string[];
  created_at?: string;
  updated_at?: string;
}

export function useProfile(userId?: string) {
  const supabase = createClient();
  
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    userId ? cacheKeys.userProfile(userId) : null,
    async () => {
      if (!userId) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return profile as UserProfile;
    },
    {
      // Profile-specific SWR options
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Cache for 5 minutes
      dedupingInterval: 5 * 60 * 1000,
    }
  );
  
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) throw new Error('No user ID provided');
    
    // Optimistic update
    await mutate(
      cacheKeys.userProfile(userId),
      async (currentData: UserProfile | undefined) => {
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
        
        if (error) throw error;
        
        return updatedProfile as UserProfile;
      },
      {
        optimisticData: (currentData) => ({
          ...currentData,
          ...updates,
          updated_at: new Date().toISOString(),
        }),
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
    
    // Invalidate related caches
    invalidateCache.userProfile(userId).forEach(key => mutate(key));
  };
  
  return {
    profile: data,
    error,
    isLoading,
    revalidate,
    updateProfile,
  };
}