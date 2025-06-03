// Client-side API helpers for database operations

export const apiClient = {
  async saveConversation(data: {
    title: string;
    persona: string;
    transcript: any[];
    duration: number;
  }) {
    const response = await fetch('/api/conversations/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save conversation');
    }
    
    return response.json();
  },

  async updateConversationAnalysis(conversationId: string, analysis: any) {
    const response = await fetch('/api/conversations/update-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, analysis }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update analysis');
    }
    
    return response.json();
  },

  async updateProgress(data: {
    vocabulary?: string[];
    minutesPracticed?: number;
    pronunciationImprovement?: number;
    grammarImprovement?: number;
    fluencyImprovement?: number;
    culturalImprovement?: number;
  }) {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update progress');
    }
    
    return response.json();
  },

  async getAdaptations() {
    const response = await fetch('/api/adaptations');
    
    if (!response.ok) {
      throw new Error('Failed to fetch adaptations');
    }
    
    return response.json();
  },

  async updateAdaptations(data: {
    common_errors?: string[];
    mastered_concepts?: string[];
    struggle_areas?: string[];
  }) {
    const response = await fetch('/api/adaptations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update adaptations');
    }
    
    return response.json();
  },
};