import { ConversationTranscript } from '@/types';

export interface ConversationAnalysis {
  wins: string[];
  mistakes: string[];
  corrections: string[];
  comprehension_level: 'excellent' | 'good' | 'fair' | 'poor';
  goal_progress: Record<string, boolean>;
  recommendations: string[];
  vocabulary_used: string[];
  grammar_patterns: string[];
  cultural_notes: string[];
  conversation_metrics: {
    totalDuration: number;
    userSpeakingTime: number;
    averageResponseTime: number;
    wordsPerMinute: number;
  };
  quality_assessment: {
    completeness: number;
    engagement: number;
    progression: number;
  };
}

export class ConversationAnalysisService {
  // Simplified for MVP - text-only analysis
  
  // Main analysis method - works with conversation transcripts
  async analyzeConversation(
    transcripts: ConversationTranscript[],
    userLevel: string = 'beginner',
    scenarioGoals: string[] = []
  ): Promise<ConversationAnalysis> {
    try {
      // Format conversation for analysis
      const conversationText = this.formatTranscriptsForAnalysis(transcripts);
      
      // Perform text-based analysis using GPT-4.1
      const semanticAnalysis = await this.performTextAnalysis(
        conversationText,
        userLevel,
        scenarioGoals
      );
      
      // Calculate metrics from transcript timing
      const metrics = this.calculateConversationMetrics(transcripts);
      
      // Assess conversation quality
      const quality = this.assessConversationQuality(transcripts);
      
      // Extract vocabulary used
      const vocabulary = this.extractVocabulary(transcripts);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(transcripts, userLevel);
      
      // Combine all analysis with defaults for undefined properties
      return {
        wins: semanticAnalysis.wins || ['Completed a conversation practice session'],
        mistakes: semanticAnalysis.mistakes || [],
        corrections: semanticAnalysis.corrections || [],
        comprehension_level: semanticAnalysis.comprehension_level || 'fair',
        goal_progress: semanticAnalysis.goal_progress || {},
        grammar_patterns: semanticAnalysis.grammar_patterns || [],
        cultural_notes: semanticAnalysis.cultural_notes || [],
        vocabulary_used: vocabulary,
        recommendations,
        conversation_metrics: metrics,
        quality_assessment: quality
      };
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      throw error;
    }
  }
  
  // Format transcripts for AI analysis
  private formatTranscriptsForAnalysis(transcripts: ConversationTranscript[]): string {
    // Ensure transcripts is an array
    if (!Array.isArray(transcripts)) {
      console.error('Transcripts is not an array:', transcripts);
      return '';
    }
    
    return transcripts.map(t => {
      // Safe date formatting inline to avoid import issues
      let timeStr = '--:--';
      try {
        if (t.timestamp) {
          const dateObj = typeof t.timestamp === 'string' ? new Date(t.timestamp) : t.timestamp;
          if (!isNaN(dateObj.getTime())) {
            timeStr = dateObj.toLocaleTimeString();
          }
        }
      } catch (error) {
        console.warn('Error formatting timestamp in conversation analysis:', t.timestamp);
      }
      return `${t.speaker.toUpperCase()}: ${t.text} (${timeStr})`;
    }).join('\\n');
  }
  
  // Perform text-based conversation analysis with GPT-4.1
  private async performTextAnalysis(
    conversationText: string,
    userLevel: string,
    scenarioGoals: string[]
  ): Promise<Partial<ConversationAnalysis>> {
    const response = await fetch('/api/analyze-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transcript: { text: conversationText },
        events: [], // No events for MVP
        scenarioGoals: scenarioGoals.map(goal => ({ id: goal, description: goal })),
        userLevel
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Analysis failed: ${errorData.error || response.statusText}`);
    }

    return response.json();
  }
  
  // Calculate conversation metrics from transcript timing
  calculateConversationMetrics(transcripts: ConversationTranscript[]): {
    totalDuration: number;
    userSpeakingTime: number;
    averageResponseTime: number;
    wordsPerMinute: number;
  } {
    if (transcripts.length === 0) {
      return { totalDuration: 0, userSpeakingTime: 0, averageResponseTime: 0, wordsPerMinute: 0 };
    }

    const firstTime = new Date(transcripts[0].timestamp).getTime();
    const lastTime = new Date(transcripts[transcripts.length - 1].timestamp).getTime();
    const totalDuration = (lastTime - firstTime) / 1000; // seconds

    const userTranscripts = transcripts.filter(t => t.speaker === 'user');
    const totalUserWords = userTranscripts.reduce((sum, t) => sum + t.text.split(' ').length, 0);
    const userSpeakingTime = totalDuration * 0.4; // Estimate user spoke 40% of time
    
    const wordsPerMinute = totalUserWords > 0 ? (totalUserWords / (userSpeakingTime / 60)) : 0;
    
    // Calculate average response time between AI and user
    let responseTimes: number[] = [];
    for (let i = 1; i < transcripts.length; i++) {
      if (transcripts[i-1].speaker !== transcripts[i].speaker) {
        const prevTime = new Date(transcripts[i-1].timestamp).getTime();
        const currTime = new Date(transcripts[i].timestamp).getTime();
        responseTimes.push((currTime - prevTime) / 1000);
      }
    }
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    return {
      totalDuration,
      userSpeakingTime,
      averageResponseTime,
      wordsPerMinute: Math.round(wordsPerMinute)
    };
  }
  
  // Extract vocabulary from conversation for progress tracking
  extractVocabulary(transcripts: ConversationTranscript[]): string[] {
    const userTranscripts = transcripts.filter(t => t.speaker === 'user');
    const words = userTranscripts
      .flatMap(t => t.text.toLowerCase().split(/\\s+/))
      .filter(word => word.length > 3) // Filter out articles, etc.
      .filter(word => /^[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc]+$/.test(word)); // Spanish words only
    
    return [...new Set(words)]; // Remove duplicates
  }
  
  // Simple conversation quality assessment
  assessConversationQuality(transcripts: ConversationTranscript[]): {
    completeness: number; // 0-1 scale
    engagement: number; // 0-1 scale
    progression: number; // 0-1 scale
  } {
    if (transcripts.length === 0) {
      return { completeness: 0, engagement: 0, progression: 0 };
    }

    // Completeness: Did they have a full conversation?
    const userMessages = transcripts.filter(t => t.speaker === 'user').length;
    const aiMessages = transcripts.filter(t => t.speaker === 'assistant').length;
    const completeness = Math.min(1, (userMessages + aiMessages) / 10); // 10+ messages = complete

    // Engagement: Average message length
    const avgUserMessageLength = transcripts
      .filter(t => t.speaker === 'user')
      .reduce((sum, t, _, arr) => sum + t.text.length / arr.length, 0);
    const engagement = Math.min(1, avgUserMessageLength / 50); // 50+ chars = engaged

    // Progression: Messages getting longer/more complex over time
    const firstHalf = transcripts.slice(0, Math.floor(transcripts.length / 2))
      .filter(t => t.speaker === 'user');
    const secondHalf = transcripts.slice(Math.floor(transcripts.length / 2))
      .filter(t => t.speaker === 'user');
    
    const firstHalfAvg = firstHalf.reduce((sum, t, _, arr) => 
      arr.length > 0 ? sum + t.text.length / arr.length : 0, 0);
    const secondHalfAvg = secondHalf.reduce((sum, t, _, arr) => 
      arr.length > 0 ? sum + t.text.length / arr.length : 0, 0);
    
    const progression = secondHalfAvg > firstHalfAvg ? 1 : 0.5;

    return { completeness, engagement, progression };
  }

  // Generate simple recommendations based on conversation
  generateRecommendations(
    transcripts: ConversationTranscript[], 
    userLevel: string
  ): string[] {
    const recommendations: string[] = [];
    const userMessages = transcripts.filter(t => t.speaker === 'user');
    
    if (userMessages.length < 3) {
      recommendations.push('Try to speak more during conversations');
    }
    
    const avgLength = userMessages.reduce((sum, t) => sum + t.text.length, 0) / userMessages.length;
    if (avgLength < 20) {
      recommendations.push('Try to use longer, more complete sentences');
    }
    
    if (userLevel === 'beginner') {
      recommendations.push('Practice common greetings and basic vocabulary');
      recommendations.push('Focus on clear pronunciation of individual words');
    }
    
    return recommendations;
  }
  
  // Static method to create a simple analysis when detailed analysis fails
  static createFallbackAnalysis(transcripts: ConversationTranscript[]): ConversationAnalysis {
    const service = new ConversationAnalysisService();
    const metrics = service.calculateConversationMetrics(transcripts);
    const quality = service.assessConversationQuality(transcripts);
    const vocabulary = service.extractVocabulary(transcripts);
    const recommendations = service.generateRecommendations(transcripts, 'beginner');
    
    return {
      wins: ['Completed a conversation practice session'],
      mistakes: [],
      corrections: [],
      comprehension_level: 'fair',
      goal_progress: {},
      recommendations,
      vocabulary_used: vocabulary,
      grammar_patterns: [],
      cultural_notes: [],
      conversation_metrics: metrics,
      quality_assessment: quality
    };
  }
}