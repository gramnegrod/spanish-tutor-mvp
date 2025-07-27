/**
 * Configuration Migrator
 * 
 * Utility to convert v2 configurations to v3 format.
 * Provides detailed warnings and suggestions for deprecated features.
 */

import type { RealtimeServiceConfig as V3Config } from '../src/core/OpenAIRealtimeService';

// V2 Configuration Types
export interface V2Config {
  session: {
    apiKey?: string;
    model?: string;
    modalities?: Array<'text' | 'audio'>;
    instructions?: string;
    voice?: string;
    inputAudioFormat?: string;
    outputAudioFormat?: string;
    inputAudioTranscription?: {
      model: string;
    };
    turnDetection?: {
      type: string;
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    };
    tools?: Array<{
      type: string;
      name: string;
      description?: string;
      parameters?: any;
    }>;
    toolChoice?: string;
    temperature?: number;
    maxResponseOutputTokens?: number;
  };
  webrtc?: {
    iceServers?: RTCIceServer[];
    enableDataChannel?: boolean;
    audioConstraints?: MediaTrackConstraints;
    videoConstraints?: MediaTrackConstraints | false;
    offerOptions?: RTCOfferOptions;
    debug?: boolean;
    tokenEndpoint?: string;
    model?: string;
  };
  connection?: {
    tokenEndpoint?: string;
  };
  sessionLimits?: {
    maxDuration?: number;
    maxTokens?: number;
  };
  telemetry?: {
    enabled?: boolean;
    endpoint?: string;
  };
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
}

export interface MigrationWarning {
  field: string;
  oldValue: any;
  message: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}

export interface MigrationResult {
  config: V3Config;
  warnings: MigrationWarning[];
  requiresManualIntervention: boolean;
}

/**
 * Migrate v2 configuration to v3 format
 */
export function migrateConfig(v2Config: V2Config): MigrationResult {
  const warnings: MigrationWarning[] = [];
  let requiresManualIntervention = false;

  // Extract token endpoint
  const tokenEndpoint = extractTokenEndpoint(v2Config, warnings);
  if (!tokenEndpoint) {
    requiresManualIntervention = true;
  }

  // Build v3 config
  const v3Config: V3Config = {
    tokenEndpoint: tokenEndpoint || '',
    debug: v2Config.debug,
    voice: mapVoice(v2Config.session.voice, warnings),
    instructions: v2Config.session.instructions,
    model: v2Config.session.model,
    iceServers: v2Config.webrtc?.iceServers
  };

  // Check for removed features
  checkRemovedFeatures(v2Config, warnings);

  // Add migration timestamp
  warnings.push({
    field: '_migration',
    oldValue: null,
    message: 'Configuration migrated from v2 to v3',
    suggestion: 'Review all warnings and test thoroughly',
    severity: 'info'
  });

  return {
    config: v3Config,
    warnings,
    requiresManualIntervention
  };
}

/**
 * Extract token endpoint from various v2 config locations
 */
function extractTokenEndpoint(config: V2Config, warnings: MigrationWarning[]): string | null {
  // Priority 1: connection.tokenEndpoint
  if (config.connection?.tokenEndpoint) {
    return config.connection.tokenEndpoint;
  }

  // Priority 2: webrtc.tokenEndpoint
  if (config.webrtc?.tokenEndpoint) {
    return config.webrtc.tokenEndpoint;
  }

  // Priority 3: Convert apiKey to token endpoint
  if (config.session.apiKey) {
    warnings.push({
      field: 'session.apiKey',
      oldValue: config.session.apiKey,
      message: 'Direct API key usage is deprecated',
      suggestion: 'Implement a server endpoint that returns ephemeral tokens',
      severity: 'error'
    });
    
    // Provide a template endpoint
    return `/api/realtime/token`;
  }

  warnings.push({
    field: 'tokenEndpoint',
    oldValue: null,
    message: 'No token endpoint found',
    suggestion: 'You must provide a tokenEndpoint that returns OpenAI ephemeral tokens',
    severity: 'error'
  });

  return null;
}

/**
 * Map v2 voice to v3 voice
 */
function mapVoice(v2Voice: string | undefined, warnings: MigrationWarning[]): V3Config['voice'] {
  const validVoices = ['alloy', 'echo', 'shimmer', 'nova', 'fable', 'onyx'];
  
  if (!v2Voice) {
    return 'alloy';
  }

  if (validVoices.includes(v2Voice)) {
    return v2Voice as V3Config['voice'];
  }

  warnings.push({
    field: 'session.voice',
    oldValue: v2Voice,
    message: `Invalid voice "${v2Voice}"`,
    suggestion: `Use one of: ${validVoices.join(', ')}`,
    severity: 'warning'
  });

  return 'alloy';
}

/**
 * Map v2 audio format to v3
 */
function mapAudioFormat(v2Format: string | undefined, warnings: MigrationWarning[]): V3Config['audioFormat'] {
  const validFormats = ['pcm16', 'g711_ulaw', 'g711_alaw'];
  
  if (!v2Format) {
    return 'pcm16';
  }

  if (validFormats.includes(v2Format)) {
    return v2Format as V3Config['audioFormat'];
  }

  warnings.push({
    field: 'session.outputAudioFormat',
    oldValue: v2Format,
    message: `Invalid audio format "${v2Format}"`,
    suggestion: `Use one of: ${validFormats.join(', ')}`,
    severity: 'warning'
  });

  return 'pcm16';
}

/**
 * Check for removed features and provide migration guidance
 */
function checkRemovedFeatures(config: V2Config, warnings: MigrationWarning[]): void {
  // Model selection
  if (config.session.model || config.webrtc?.model) {
    warnings.push({
      field: 'model',
      oldValue: config.session.model || config.webrtc?.model,
      message: 'Model selection has moved to server-side token generation',
      suggestion: 'Configure the model when generating ephemeral tokens on your server',
      severity: 'warning'
    });
  }

  // Modalities
  if (config.session.modalities) {
    warnings.push({
      field: 'session.modalities',
      oldValue: config.session.modalities,
      message: 'Modalities are now always text and audio in WebRTC mode',
      suggestion: 'Remove this configuration',
      severity: 'info'
    });
  }

  // Input audio format
  if (config.session.inputAudioFormat) {
    warnings.push({
      field: 'session.inputAudioFormat',
      oldValue: config.session.inputAudioFormat,
      message: 'Input audio format is now handled automatically by WebRTC',
      suggestion: 'Remove this configuration',
      severity: 'info'
    });
  }

  // Tools and function calling
  if (config.session.tools && config.session.tools.length > 0) {
    warnings.push({
      field: 'session.tools',
      oldValue: config.session.tools,
      message: 'Function calling configuration has changed significantly',
      suggestion: 'Configure tools server-side when generating tokens, or use the new function calling API',
      severity: 'error'
    });
  }

  // Tool choice
  if (config.session.toolChoice) {
    warnings.push({
      field: 'session.toolChoice',
      oldValue: config.session.toolChoice,
      message: 'Tool choice is now configured server-side',
      suggestion: 'Configure when generating ephemeral tokens',
      severity: 'warning'
    });
  }

  // Temperature
  if (config.session.temperature !== undefined) {
    warnings.push({
      field: 'session.temperature',
      oldValue: config.session.temperature,
      message: 'Temperature is now configured server-side',
      suggestion: 'Configure when generating ephemeral tokens',
      severity: 'info'
    });
  }

  // Max tokens
  if (config.session.maxResponseOutputTokens) {
    warnings.push({
      field: 'session.maxResponseOutputTokens',
      oldValue: config.session.maxResponseOutputTokens,
      message: 'Max tokens is now configured server-side',
      suggestion: 'Configure when generating ephemeral tokens',
      severity: 'info'
    });
  }

  // Session limits
  if (config.sessionLimits) {
    warnings.push({
      field: 'sessionLimits',
      oldValue: config.sessionLimits,
      message: 'Session limits are now managed server-side',
      suggestion: 'Implement session management in your token endpoint',
      severity: 'warning'
    });
  }

  // Telemetry
  if (config.telemetry) {
    warnings.push({
      field: 'telemetry',
      oldValue: config.telemetry,
      message: 'Built-in telemetry has been removed',
      suggestion: 'Implement custom analytics using the event system',
      severity: 'info'
    });
  }

  // WebRTC constraints
  if (config.webrtc?.audioConstraints || config.webrtc?.videoConstraints) {
    warnings.push({
      field: 'webrtc.constraints',
      oldValue: { audio: config.webrtc.audioConstraints, video: config.webrtc.videoConstraints },
      message: 'Media constraints are now handled automatically',
      suggestion: 'Remove these configurations',
      severity: 'info'
    });
  }

  // Data channel
  if (config.webrtc?.enableDataChannel === false) {
    warnings.push({
      field: 'webrtc.enableDataChannel',
      oldValue: false,
      message: 'Data channel is now always enabled and required',
      suggestion: 'Remove this configuration',
      severity: 'error'
    });
  }

  // Reconnect attempts
  if (config.maxReconnectAttempts !== undefined && config.maxReconnectAttempts !== 3) {
    warnings.push({
      field: 'maxReconnectAttempts',
      oldValue: config.maxReconnectAttempts,
      message: 'Custom reconnect attempts not supported in v3',
      suggestion: 'Use the default behavior or implement custom reconnection logic',
      severity: 'info'
    });
  }

  // Reconnect delay
  if (config.reconnectDelay !== undefined && config.reconnectDelay !== 2000) {
    warnings.push({
      field: 'reconnectDelay',
      oldValue: config.reconnectDelay,
      message: 'Custom reconnect delay not supported in v3',
      suggestion: 'Use the default behavior or implement custom reconnection logic',
      severity: 'info'
    });
  }
}

/**
 * Generate migration script
 */
export function generateMigrationScript(v2Config: V2Config): string {
  const result = migrateConfig(v2Config);
  
  let script = `// OpenAI Realtime WebRTC - V2 to V3 Migration Script\n`;
  script += `// Generated on: ${new Date().toISOString()}\n\n`;
  
  script += `import { OpenAIRealtimeService } from '@openai-realtime/webrtc';\n\n`;
  
  // Add warnings as comments
  if (result.warnings.length > 0) {
    script += `/*\n * Migration Warnings:\n`;
    result.warnings.forEach(warning => {
      script += ` * - ${warning.field}: ${warning.message}\n`;
      script += ` *   Suggestion: ${warning.suggestion}\n`;
    });
    script += ` */\n\n`;
  }
  
  // Add manual intervention notice
  if (result.requiresManualIntervention) {
    script += `// ⚠️ MANUAL INTERVENTION REQUIRED ⚠️\n`;
    script += `// Some features require server-side changes.\n`;
    script += `// Please review the warnings above.\n\n`;
  }
  
  // Generate v3 config
  script += `// V3 Configuration\n`;
  script += `const config = ${JSON.stringify(result.config, null, 2)};\n\n`;
  
  // Add token endpoint implementation template
  if (!v2Config.connection?.tokenEndpoint && !v2Config.webrtc?.tokenEndpoint) {
    script += `// TODO: Implement token endpoint\n`;
    script += `// Example Express.js endpoint:\n`;
    script += `/*\napp.get('/api/realtime/token', async (req, res) => {\n`;
    script += `  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {\n`;
    script += `    method: 'POST',\n`;
    script += `    headers: {\n`;
    script += `      'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,\n`;
    script += `      'Content-Type': 'application/json'\n`;
    script += `    },\n`;
    script += `    body: JSON.stringify({\n`;
    script += `      model: 'gpt-4o-realtime-preview-2024-12-17',\n`;
    script += `      voice: 'alloy'\n`;
    script += `    })\n`;
    script += `  });\n`;
    script += `  const data = await response.json();\n`;
    script += `  res.json(data);\n`;
    script += `});\n*/\n\n`;
  }
  
  // Usage example
  script += `// Usage\n`;
  script += `const service = new OpenAIRealtimeService(config);\n\n`;
  script += `// Connect to the service\n`;
  script += `await service.connect();\n\n`;
  script += `// Send a message\n`;
  script += `await service.sendText('Hello!');\n\n`;
  script += `// Listen for responses\n`;
  script += `service.on('message', (message) => {\n`;
  script += `  console.log('Received:', message);\n`;
  script += `});\n`;
  
  return script;
}

/**
 * Validate v3 configuration
 */
export function validateV3Config(config: V3Config): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.tokenEndpoint) {
    errors.push('tokenEndpoint is required');
  }
  
  if (config.voice && !['alloy', 'echo', 'shimmer', 'nova', 'fable', 'onyx'].includes(config.voice)) {
    errors.push(`Invalid voice: ${config.voice}`);
  }
  
  if (config.audioFormat && !['pcm16', 'g711_ulaw', 'g711_alaw'].includes(config.audioFormat)) {
    errors.push(`Invalid audio format: ${config.audioFormat}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}