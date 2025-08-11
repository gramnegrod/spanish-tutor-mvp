/**
 * Cost Tracking Module for OpenAI Realtime API
 */

import { CostTracking, RealtimeUsage } from './types';
import { PRICING, AUDIO_CONSTANTS } from './constants';

export class CostTracker {
  private costTracking: CostTracking = {
    audioInputSeconds: 0,
    audioOutputSeconds: 0,
    textInputTokens: 0,
    textOutputTokens: 0,
    audioInputCost: 0,
    audioOutputCost: 0,
    textInputCost: 0,
    textOutputCost: 0,
    totalCost: 0
  };

  private onCostUpdate?: (costs: CostTracking) => void;

  constructor(onCostUpdate?: (costs: CostTracking) => void) {
    this.onCostUpdate = onCostUpdate;
  }

  trackAudioDuration(type: 'input' | 'output', durationMs: number): void {
    const durationSeconds = durationMs / 1000;
    
    if (type === 'input') {
      this.costTracking.audioInputSeconds += durationSeconds;
    } else {
      this.costTracking.audioOutputSeconds += durationSeconds;
    }
    
    this.calculateCosts();
  }

  trackTextTokens(type: 'input' | 'output', tokens: number): void {
    if (type === 'input') {
      this.costTracking.textInputTokens += tokens;
    } else {
      this.costTracking.textOutputTokens += tokens;
    }
    
    this.calculateCosts();
  }

  updateFromUsage(usage: RealtimeUsage): void {
    // Track input audio tokens and calculate duration
    if (usage.input_token_details?.audio_tokens) {
      const inputAudioSeconds = usage.input_token_details.audio_tokens / AUDIO_CONSTANTS.audioTokensPerSecond;
      console.log('[CostTracker] Input audio tokens:', usage.input_token_details.audio_tokens, '≈', inputAudioSeconds.toFixed(2), 'seconds');
      this.costTracking.audioInputSeconds = inputAudioSeconds;
    }
    
    // Track output audio tokens and calculate duration
    if (usage.output_token_details?.audio_tokens) {
      const outputAudioSeconds = usage.output_token_details.audio_tokens / AUDIO_CONSTANTS.audioTokensPerSecond;
      console.log('[CostTracker] Output audio tokens:', usage.output_token_details.audio_tokens, '≈', outputAudioSeconds.toFixed(2), 'seconds');
      this.costTracking.audioOutputSeconds += outputAudioSeconds;
    }
    
    // Track text tokens
    if (usage.input_token_details?.text_tokens) {
      this.costTracking.textInputTokens = usage.input_token_details.text_tokens;
    }
    if (usage.output_token_details?.text_tokens) {
      this.costTracking.textOutputTokens = usage.output_token_details.text_tokens;
    }
    
    this.calculateCosts();
  }

  private calculateCosts(): void {
    const costs = { ...this.costTracking };
    
    // Convert seconds to minutes for pricing calculation
    const audioInputMinutes = costs.audioInputSeconds / 60;
    const audioOutputMinutes = costs.audioOutputSeconds / 60;
    
    // Calculate audio costs based on per-minute pricing
    costs.audioInputCost = audioInputMinutes * PRICING.audioInputPerMinute;
    costs.audioOutputCost = audioOutputMinutes * PRICING.audioOutputPerMinute;
    
    // Text costs are minimal in voice conversations (only for instructions)
    costs.textInputCost = (costs.textInputTokens / 1_000_000) * PRICING.textInput;
    costs.textOutputCost = (costs.textOutputTokens / 1_000_000) * PRICING.textOutput;
    
    costs.totalCost = costs.audioInputCost + costs.audioOutputCost + 
                      costs.textInputCost + costs.textOutputCost;
    
    // Debug logging with corrected calculation
    if (costs.audioInputSeconds > 0 || costs.audioOutputSeconds > 0) {
      console.log('[CostTracker] Cost Update:', {
        inputSeconds: costs.audioInputSeconds.toFixed(2),
        outputSeconds: costs.audioOutputSeconds.toFixed(2),
        inputMinutes: audioInputMinutes.toFixed(2),
        outputMinutes: audioOutputMinutes.toFixed(2),
        inputCost: `$${costs.audioInputCost.toFixed(4)}`,
        outputCost: `$${costs.audioOutputCost.toFixed(4)}`,
        totalCost: `$${costs.totalCost.toFixed(4)}`
      });
    }
    
    this.costTracking = costs;
    this.onCostUpdate?.(costs);
  }

  getCurrentCosts(): CostTracking {
    return { ...this.costTracking };
  }

  reset(): void {
    this.costTracking = {
      audioInputSeconds: 0,
      audioOutputSeconds: 0,
      textInputTokens: 0,
      textOutputTokens: 0,
      audioInputCost: 0,
      audioOutputCost: 0,
      textInputCost: 0,
      textOutputCost: 0,
      totalCost: 0
    };
    this.onCostUpdate?.(this.costTracking);
  }
}