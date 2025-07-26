import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: (error: any) => {
    // Don't retry on 4xx errors except 429 (rate limit)
    if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
      return false;
    }
    return true;
  },
  
  // Revalidation on focus
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  
  // Cache configuration
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  
  // Offline support
  provider: () => new Map(),
  isOnline() {
    return navigator.onLine;
  },
  isVisible() {
    return document.visibilityState === 'visible';
  },
  
  // Global fetcher
  fetcher: async (url: string) => {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const error = new Error('An error occurred while fetching the data.');
      // Attach extra info to the error object
      (error as any).info = await res.json();
      (error as any).status = res.status;
      throw error;
    }
    
    return res.json();
  },
  
  // Loading states
  loadingTimeout: 3000,
  
  // Compare function for deep comparison
  compare: (a: any, b: any) => {
    return JSON.stringify(a) === JSON.stringify(b);
  },
};

// Cache keys for different data types
export const cacheKeys = {
  userProfile: (userId: string) => `/api/profile/${userId}`,
  npcData: (npcId: string) => `/api/npc/${npcId}`,
  npcList: () => '/api/npc',
  analytics: (userId: string) => `/api/analytics/${userId}`,
  progress: (userId: string) => `/api/progress/${userId}`,
  conversations: (userId: string) => `/api/conversations?userId=${userId}`,
  conversation: (conversationId: string) => `/api/conversations/${conversationId}`,
} as const;

// Cache invalidation helpers
export const invalidateCache = {
  userProfile: (userId: string) => [cacheKeys.userProfile(userId)],
  npcData: (npcId: string) => [cacheKeys.npcData(npcId), cacheKeys.npcList()],
  analytics: (userId: string) => [cacheKeys.analytics(userId)],
  progress: (userId: string) => [cacheKeys.progress(userId)],
  conversations: (userId: string) => [cacheKeys.conversations(userId)],
  conversation: (conversationId: string) => [cacheKeys.conversation(conversationId)],
  all: (userId: string) => [
    cacheKeys.userProfile(userId),
    cacheKeys.analytics(userId),
    cacheKeys.progress(userId),
    cacheKeys.conversations(userId),
  ],
};