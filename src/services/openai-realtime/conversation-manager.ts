/**
 * Conversation History and Summarization Module
 */

import { ConversationEntry } from './types';

export class ConversationManager {
  private conversationHistory: ConversationEntry[] = [];
  private summarizedContext: string = '';

  addEntry(role: 'user' | 'assistant', text: string): void {
    this.conversationHistory.push({
      role,
      text,
      timestamp: new Date()
    });
    
    // Check if we need to summarize (every 20 messages)
    if (this.conversationHistory.length > 20) {
      this.smartSummarize();
    }
  }

  private smartSummarize(): void {
    // Keep last 5 exchanges (10 messages) verbatim
    const keepCount = 10;
    const messagesToSummarize = this.conversationHistory.slice(0, -keepCount);
    const messagesToKeep = this.conversationHistory.slice(-keepCount);
    
    if (messagesToSummarize.length === 0) return;
    
    // Create summary of older messages
    const summary = this.createSummary(messagesToSummarize);
    
    // Update summarized context
    if (this.summarizedContext) {
      this.summarizedContext += ` ${summary}`;
    } else {
      this.summarizedContext = `Previous conversation summary: ${summary}`;
    }
    
    // Keep only recent messages
    this.conversationHistory = messagesToKeep;
    
    console.log('[ConversationManager] Smart summary applied. Context optimized.');
  }

  private createSummary(messages: ConversationEntry[]): string {
    // Simple summarization logic - in production, you might use an LLM for this
    const topics = new Set<string>();
    const userQuestions = [];
    const tutorResponses = [];
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        userQuestions.push(msg.text);
        // Extract potential topics (very simple keyword extraction)
        const words = msg.text.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 4 && !['para', 'donde', 'como', 'cuando', 'porque'].includes(word)) {
            topics.add(word);
          }
        });
      } else {
        tutorResponses.push(msg.text);
      }
    }
    
    const topicList = Array.from(topics).slice(0, 5).join(', ');
    
    return `User practiced Spanish conversation covering topics: ${topicList}. ` +
           `The tutor helped with vocabulary, pronunciation, and cultural context. ` +
           `Conversation was friendly and educational.`;
  }

  getHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  getSummarizedContext(): string {
    return this.summarizedContext;
  }

  reset(): void {
    this.conversationHistory = [];
    this.summarizedContext = '';
    console.log('[ConversationManager] Conversation history reset');
  }
}