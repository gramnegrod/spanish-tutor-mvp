/**
 * OpenAI Realtime WebRTC - Compatibility Layer
 * 
 * This compatibility layer provides backwards compatibility for v2 API users.
 * It allows gradual migration from v2 to v3 without breaking existing code.
 * 
 * @deprecated This compatibility layer will be removed in v4.0.0 (July 2025)
 * 
 * Migration Guide:
 * 1. Use the v2-adapter for immediate compatibility
 * 2. Use config-migrator to convert your configuration
 * 3. Use event-mapper to understand event changes
 * 4. Review examples for migration patterns
 * 5. Gradually update to v3 API directly
 */

// Re-export v2 adapter as default for drop-in compatibility
export { OpenAIRealtimeService as default } from './v2-adapter';
export { OpenAIRealtimeService } from './v2-adapter';

// Export migration utilities
export { 
  migrateConfig, 
  generateMigrationScript, 
  validateV3Config,
  type V2Config,
  type MigrationResult,
  type MigrationWarning 
} from './config-migrator';

export {
  mapEvent,
  createV2EventHandler,
  getEventMigrationGuide,
  convertEventListeners,
  EVENT_MAPPINGS,
  type V2Events,
  type EventMapping
} from './event-mapper';

// Show deprecation notice on import
if (typeof console !== 'undefined' && console.warn) {
  console.warn(
    '⚠️ [@openai-realtime/webrtc] You are using the v2 compatibility layer.\n' +
    'This layer is deprecated and will be removed in v4.0.0 (July 2025).\n' +
    'Please migrate to the v3 API. See migration guide at:\n' +
    'https://github.com/openai/realtime-webrtc/blob/main/docs/MIGRATION.md'
  );
}

/**
 * Quick migration helper
 * 
 * @example
 * ```typescript
 * import { quickMigrate } from '@openai-realtime/webrtc/compat';
 * 
 * const v3Config = quickMigrate(myV2Config);
 * ```
 */
export function quickMigrate(v2Config: any) {
  const { migrateConfig } = require('./config-migrator');
  const result = migrateConfig(v2Config);
  
  if (result.warnings.length > 0) {
    console.warn('Migration warnings:');
    result.warnings.forEach(w => {
      console.warn(`- ${w.field}: ${w.suggestion}`);
    });
  }
  
  if (result.requiresManualIntervention) {
    console.error(
      '❌ Manual intervention required!\n' +
      'You must implement a token endpoint.\n' +
      'See: https://github.com/openai/realtime-webrtc#token-endpoint'
    );
  }
  
  return result.config;
}