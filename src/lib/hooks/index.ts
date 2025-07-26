// Export all custom hooks with SWR caching
export * from './useProfile';
export * from './useNPCs';
export * from './useAnalytics';
export * from './useConversations';

// Re-export SWR utilities for cache management
export { mutate, useSWRConfig } from 'swr';
export { cacheKeys, invalidateCache } from '../swr-config';