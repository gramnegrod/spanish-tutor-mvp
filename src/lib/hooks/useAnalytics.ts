import useSWR, { mutate } from 'swr';
import { cacheKeys, invalidateCache } from '../swr-config';
import { createClient } from '@/utils/supabase/client';

export interface AnalyticsData {
  totalConversations: number;
  totalMinutes: number;
  averageAccuracy: number;
  vocabularyMastered: number;
  weeklyProgress: {
    date: string;
    minutes: number;
    conversations: number;
  }[];
  topicsExplored: {
    topic: string;
    count: number;
  }[];
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
}

export function useAnalytics(userId?: string) {
  const supabase = createClient();
  
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    userId ? cacheKeys.analytics(userId) : null,
    async () => {
      if (!userId) return null;
      
      // Fetch conversations for analytics
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (convError) throw convError;
      
      // Calculate analytics
      const analytics: AnalyticsData = {
        totalConversations: conversations?.length || 0,
        totalMinutes: conversations?.reduce((sum, conv) => {
          const duration = conv.metadata?.duration || 0;
          return sum + Math.round(duration / 60);
        }, 0) || 0,
        averageAccuracy: conversations?.reduce((sum, conv) => {
          const accuracy = conv.analysis?.accuracy || 0;
          return sum + accuracy;
        }, 0) / (conversations?.length || 1) || 0,
        vocabularyMastered: new Set(
          conversations?.flatMap(conv => 
            conv.analysis?.vocabulary_used || []
          ) || []
        ).size,
        weeklyProgress: generateWeeklyProgress(conversations || []),
        topicsExplored: generateTopicsData(conversations || []),
        strengthsAndWeaknesses: analyzeStrengthsWeaknesses(conversations || []),
      };
      
      return analytics;
    },
    {
      // Analytics data changes less frequently
      dedupingInterval: 10 * 60 * 1000, // 10 minutes
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  
  // Force refresh analytics
  const refreshAnalytics = async () => {
    await revalidate();
    // Also invalidate related caches
    invalidateCache.analytics(userId!).forEach(key => mutate(key));
  };
  
  return {
    analytics: data,
    error,
    isLoading,
    refreshAnalytics,
  };
}

// Helper functions
function generateWeeklyProgress(conversations: any[]) {
  const weekData: Record<string, { minutes: number; conversations: number }> = {};
  const now = new Date();
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    weekData[dateKey] = { minutes: 0, conversations: 0 };
  }
  
  // Populate with actual data
  conversations.forEach(conv => {
    const dateKey = new Date(conv.created_at).toISOString().split('T')[0];
    if (weekData[dateKey]) {
      weekData[dateKey].conversations++;
      weekData[dateKey].minutes += Math.round((conv.metadata?.duration || 0) / 60);
    }
  });
  
  return Object.entries(weekData).map(([date, data]) => ({
    date,
    ...data,
  }));
}

function generateTopicsData(conversations: any[]) {
  const topics: Record<string, number> = {};
  
  conversations.forEach(conv => {
    const topic = conv.metadata?.topic || 'general';
    topics[topic] = (topics[topic] || 0) + 1;
  });
  
  return Object.entries(topics)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function analyzeStrengthsWeaknesses(conversations: any[]) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Analyze patterns in conversations
  const recentConvs = conversations.slice(0, 10);
  const avgAccuracy = recentConvs.reduce((sum, conv) => 
    sum + (conv.analysis?.accuracy || 0), 0
  ) / (recentConvs.length || 1);
  
  if (avgAccuracy > 0.8) {
    strengths.push('High overall accuracy');
  } else if (avgAccuracy < 0.6) {
    weaknesses.push('Accuracy needs improvement');
  }
  
  // Check vocabulary diversity
  const uniqueWords = new Set(
    recentConvs.flatMap(conv => conv.analysis?.vocabulary_used || [])
  );
  if (uniqueWords.size > 50) {
    strengths.push('Good vocabulary diversity');
  } else if (uniqueWords.size < 20) {
    weaknesses.push('Limited vocabulary usage');
  }
  
  return { strengths, weaknesses };
}