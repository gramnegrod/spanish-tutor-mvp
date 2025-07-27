/**
 * Configuration Migration Example
 * 
 * Shows how to migrate v2 configurations to v3
 */

import { migrateConfig, generateMigrationScript, validateV3Config } from '../config-migrator';
import type { V2Config } from '../config-migrator';
import type { RealtimeServiceConfig } from '@openai-realtime/webrtc';

// ============================================
// Example 1: Basic Configuration
// ============================================

const basicV2Config: V2Config = {
  session: {
    apiKey: 'sk-1234567890',
    voice: 'alloy',
    instructions: 'You are a helpful assistant.'
  },
  debug: true,
  autoReconnect: true
};

console.log('=== Basic Configuration Migration ===');
const basicResult = migrateConfig(basicV2Config);

console.log('V3 Config:', basicResult.config);
console.log('Warnings:');
basicResult.warnings.forEach(w => {
  console.log(`- ${w.field}: ${w.message}`);
  console.log(`  Suggestion: ${w.suggestion}`);
});

// ============================================
// Example 2: Complex Configuration
// ============================================

const complexV2Config: V2Config = {
  session: {
    apiKey: 'sk-1234567890',
    model: 'gpt-4o-realtime-preview',
    modalities: ['text', 'audio'],
    voice: 'echo',
    instructions: 'You are an expert assistant.',
    inputAudioFormat: 'pcm16',
    outputAudioFormat: 'pcm16',
    inputAudioTranscription: {
      model: 'whisper-1'
    },
    turnDetection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },
    tools: [
      {
        type: 'function',
        name: 'get_weather',
        description: 'Get weather information',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          }
        }
      }
    ],
    toolChoice: 'auto',
    temperature: 0.7,
    maxResponseOutputTokens: 2048
  },
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    enableDataChannel: true,
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    debug: true
  },
  connection: {
    tokenEndpoint: '/api/tokens'
  },
  sessionLimits: {
    maxDuration: 3600000,
    maxTokens: 10000
  },
  telemetry: {
    enabled: true,
    endpoint: '/api/telemetry'
  },
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  debug: true
};

console.log('\n=== Complex Configuration Migration ===');
const complexResult = migrateConfig(complexV2Config);

console.log('V3 Config:', JSON.stringify(complexResult.config, null, 2));
console.log('\nWarnings by severity:');

const warningsBySeverity = complexResult.warnings.reduce((acc, w) => {
  if (!acc[w.severity]) acc[w.severity] = [];
  acc[w.severity].push(w);
  return acc;
}, {} as Record<string, typeof complexResult.warnings>);

Object.entries(warningsBySeverity).forEach(([severity, warnings]) => {
  console.log(`\n${severity.toUpperCase()}:`);
  warnings.forEach(w => {
    console.log(`- ${w.field}: ${w.message}`);
  });
});

// ============================================
// Example 3: Minimal Configuration
// ============================================

const minimalV2Config: V2Config = {
  session: {
    voice: 'shimmer'
  }
};

console.log('\n=== Minimal Configuration Migration ===');
const minimalResult = migrateConfig(minimalV2Config);

if (minimalResult.requiresManualIntervention) {
  console.log('⚠️  Manual intervention required!');
  console.log('You must provide a token endpoint.');
}

// ============================================
// Example 4: Generate Migration Script
// ============================================

console.log('\n=== Generated Migration Script ===');
const migrationScript = generateMigrationScript(complexV2Config);
console.log(migrationScript);

// ============================================
// Example 5: Validate V3 Configuration
// ============================================

console.log('\n=== V3 Configuration Validation ===');

const validV3Config: RealtimeServiceConfig = {
  tokenEndpoint: '/api/realtime/token',
  voice: 'alloy',
  instructions: 'You are a helpful assistant.',
  audioFormat: 'pcm16',
  enableVAD: true,
  debug: true
};

const validation = validateV3Config(validV3Config);
console.log('Valid config:', validation.valid);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
}

// Invalid config example
const invalidV3Config: any = {
  voice: 'invalid-voice',
  audioFormat: 'mp3'
};

const invalidValidation = validateV3Config(invalidV3Config);
console.log('\nInvalid config:', invalidValidation.valid);
console.log('Errors:', invalidValidation.errors);

// ============================================
// Migration Strategies
// ============================================

console.log('\n=== Migration Strategies ===');

// Strategy 1: Gradual Migration
console.log('\n1. Gradual Migration:');
console.log('   - Use compatibility layer initially');
console.log('   - Implement token endpoint');
console.log('   - Update event handlers one by one');
console.log('   - Switch to v3 API when ready');

// Strategy 2: Full Migration
console.log('\n2. Full Migration:');
console.log('   - Use config migrator');
console.log('   - Update all code at once');
console.log('   - Test thoroughly');
console.log('   - Deploy with confidence');

// Strategy 3: Parallel Running
console.log('\n3. Parallel Running:');
console.log('   - Run v2 and v3 side by side');
console.log('   - Compare behavior');
console.log('   - Switch traffic gradually');
console.log('   - Remove v2 when stable');

// ============================================
// Common Patterns
// ============================================

console.log('\n=== Common Migration Patterns ===');

// Pattern 1: Token Endpoint Implementation
console.log('\n1. Token Endpoint:');
console.log(`
// Before (v2): API key in client
const config = {
  session: { apiKey: 'sk-...' }
};

// After (v3): Token endpoint
const config = {
  tokenEndpoint: '/api/realtime/token'
};

// Server implementation:
app.get('/api/realtime/token', async (req, res) => {
  const token = await createEphemeralToken({
    model: 'gpt-4o-realtime-preview-2024-12-17',
    // Configure everything server-side
  });
  res.json(token);
});
`);

// Pattern 2: Flat Configuration
console.log('\n2. Configuration Structure:');
console.log(`
// Before (v2): Nested structure
const config = {
  session: { voice: 'alloy' },
  webrtc: { iceServers: [...] }
};

// After (v3): Flat structure
const config = {
  voice: 'alloy',
  iceServers: [...]
};
`);

// Pattern 3: Server-Side Settings
console.log('\n3. Server-Side Settings:');
console.log(`
// Settings that moved server-side:
// - model
// - temperature
// - tools/functions
// - maxResponseOutputTokens
// - turnDetection details

// Configure these when creating tokens
`);

export {};