import useSWR, { mutate, preload } from 'swr';
import { cacheKeys, invalidateCache } from '../swr-config';
import { createClient } from '@/utils/supabase/client';

export interface Conversation {
  id: string;
  user_id: string;
  messages: any[];
  analysis?: any;
  metadata?: {
    duration?: number;
    topic?: string;
    npc_id?: string;
    destination?: string;
  };
  created_at: string;
  updated_at: string;
}

export function useConversations(userId?: string, limit: number = 10) {
  const supabase = createClient();
  
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    userId ? `${cacheKeys.conversations(userId)}&limit=${limit}` : null,
    async () => {
      if (!userId) return [];
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return conversations as Conversation[];
    },
    {
      // Conversations list changes more frequently
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      revalidateIfStale: true,
      revalidateOnFocus: true,
    }
  );
  
  return {
    conversations: data || [],
    error,
    isLoading,
    revalidate,
  };
}

export function useConversation(conversationId?: string) {
  const supabase = createClient();
  
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    conversationId ? cacheKeys.conversation(conversationId) : null,
    async () => {
      if (!conversationId) return null;
      
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (error) throw error;
      return conversation as Conversation;
    },
    {
      // Individual conversation data
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  
  const updateConversation = async (updates: Partial<Conversation>) => {
    if (!conversationId) throw new Error('No conversation ID provided');
    
    // Optimistic update
    await mutate(
      cacheKeys.conversation(conversationId),
      async (currentData: Conversation | undefined) => {
        const { data: updated, error } = await supabase
          .from('conversations')
          .update(updates)
          .eq('id', conversationId)
          .select()
          .single();
        
        if (error) throw error;
        
        return updated as Conversation;
      },
      {
        optimisticData: (currentData) => ({
          ...currentData!,
          ...updates,
          updated_at: new Date().toISOString(),
        }),
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
    
    // Invalidate related caches
    if (data?.user_id) {
      invalidateCache.conversations(data.user_id).forEach(key => mutate(key));
    }
  };
  
  return {
    conversation: data,
    error,
    isLoading,
    revalidate,
    updateConversation,
  };
}

// Prefetch conversations for better performance
export function prefetchConversations(userId: string) {
  const key = `${cacheKeys.conversations(userId)}&limit=10`;
  preload(key, async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  });
}