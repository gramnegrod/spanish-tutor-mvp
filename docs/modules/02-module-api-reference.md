# Module API Reference

This document provides a comprehensive reference for all interfaces, types, and methods used in the Spanish Tutor module system.

## Core Interfaces

### Module Interface

The base interface that all modules must implement:

```typescript
interface Module {
  config: ModuleConfig;
  initialize?: () => Promise<void>;
  activate?: () => Promise<void>;
  deactivate?: () => Promise<void>;
  Component: React.ComponentType;
  services?: Record<string, any>;
}
```

#### Properties

- **config** (required): Module configuration object
- **initialize** (optional): Called once when module is first loaded
- **activate** (optional): Called when module becomes active
- **deactivate** (optional): Called when module becomes inactive
- **Component** (required): Root React component for the module
- **services** (optional): Exported services for other modules to use

### ModuleConfig Interface

Configuration object for module registration:

```typescript
interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  permissions: Permission[];
  dependencies: string[];
  settings?: Record<string, any>;
  metadata?: ModuleMetadata;
}
```

#### Properties

- **id**: Unique identifier for the module
- **name**: Display name shown in UI
- **description**: Brief description of module functionality
- **icon**: Material-UI icon name
- **route**: URL path for the module
- **permissions**: Required user permissions
- **dependencies**: Required service dependencies
- **settings**: Module-specific configuration
- **metadata**: Additional module information

### ModuleMetadata Interface

Extended information about a module:

```typescript
interface ModuleMetadata {
  version: string;
  author: string;
  category: ModuleCategory;
  tags: string[];
  minUserLevel?: number;
  maxUserLevel?: number;
  estimatedDuration?: number; // in minutes
  supportedLanguages: string[];
}
```

## Type Definitions

### Permission Type

```typescript
type Permission = 
  | 'basic_user'
  | 'premium_user'
  | 'admin'
  | 'beta_tester';
```

### ModuleCategory Type

```typescript
type ModuleCategory = 
  | 'conversation'
  | 'grammar'
  | 'vocabulary'
  | 'reading'
  | 'listening'
  | 'culture';
```

### ModuleStatus Type

```typescript
type ModuleStatus = 
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'active'
  | 'error'
  | 'disabled';
```

## Module Registry API

### registerModule

Register a new module with the system:

```typescript
function registerModule(module: Module): void
```

**Usage:**
```typescript
import { registerModule } from '@/core/module-registry';
import DailyNewsModule from '@/modules/daily-news';

registerModule(DailyNewsModule);
```

### getModule

Retrieve a registered module by ID:

```typescript
function getModule(moduleId: string): Module | undefined
```

**Usage:**
```typescript
const module = getModule('daily-news');
if (module) {
  console.log(module.config.name);
}
```

### getAllModules

Get all registered modules:

```typescript
function getAllModules(): Module[]
```

**Usage:**
```typescript
const modules = getAllModules();
modules.forEach(module => {
  console.log(module.config.id);
});
```

### getModuleStatus

Get current status of a module:

```typescript
function getModuleStatus(moduleId: string): ModuleStatus
```

**Usage:**
```typescript
const status = getModuleStatus('free-practice');
if (status === 'active') {
  // Module is currently active
}
```

## Module Lifecycle Hooks

### initialize

Called once when the module is first loaded:

```typescript
interface Module {
  initialize?: () => Promise<void>;
}
```

**Example:**
```typescript
async initialize() {
  // Set up database connections
  await db.connect();
  
  // Load initial data
  await this.loadConfiguration();
  
  // Register event listeners
  eventBus.on('user-login', this.handleUserLogin);
}
```

### activate

Called when the module becomes active:

```typescript
interface Module {
  activate?: () => Promise<void>;
}
```

**Example:**
```typescript
async activate() {
  // Start background tasks
  this.intervalId = setInterval(this.checkForUpdates, 60000);
  
  // Load user-specific data
  await this.loadUserProgress();
  
  // Send analytics
  analytics.track('module_activated', { moduleId: this.config.id });
}
```

### deactivate

Called when the module becomes inactive:

```typescript
interface Module {
  deactivate?: () => Promise<void>;
}
```

**Example:**
```typescript
async deactivate() {
  // Stop background tasks
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
  
  // Save current state
  await this.saveProgress();
  
  // Clean up resources
  this.cleanup();
}
```

## Shared Services API

### AI Service

Interface for AI-powered conversation:

```typescript
interface AIService {
  startConversation(config: ConversationConfig): Promise<Conversation>;
  sendMessage(conversationId: string, message: string): Promise<AIResponse>;
  endConversation(conversationId: string): Promise<void>;
  getCorrections(text: string): Promise<Correction[]>;
}

interface ConversationConfig {
  language: 'es' | 'en';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic?: string;
  context?: string;
}

interface AIResponse {
  message: string;
  corrections?: Correction[];
  suggestions?: string[];
  vocabulary?: VocabularyItem[];
}
```

**Usage:**
```typescript
const aiService = getService('ai-service');
const conversation = await aiService.startConversation({
  language: 'es',
  difficulty: 'intermediate',
  topic: 'travel'
});

const response = await aiService.sendMessage(
  conversation.id,
  'Quiero viajar a España'
);
```

### Progress Tracking Service

Interface for tracking user progress:

```typescript
interface ProgressService {
  trackActivity(activity: Activity): Promise<void>;
  getProgress(userId: string, moduleId?: string): Promise<Progress>;
  getAchievements(userId: string): Promise<Achievement[]>;
  updateStreak(userId: string): Promise<number>;
}

interface Activity {
  userId: string;
  moduleId: string;
  type: 'lesson_completed' | 'practice_session' | 'achievement_earned';
  duration: number; // in seconds
  metadata?: Record<string, any>;
}

interface Progress {
  totalTime: number;
  sessionsCompleted: number;
  wordsLearned: number;
  accuracy: number;
  streak: number;
}
```

**Usage:**
```typescript
const progressService = getService('progress-service');

await progressService.trackActivity({
  userId: currentUser.id,
  moduleId: 'free-practice',
  type: 'practice_session',
  duration: 1800, // 30 minutes
  metadata: {
    wordsSpoken: 250,
    corrections: 12
  }
});
```

### Translation Service

Interface for text translation:

```typescript
interface TranslationService {
  translate(text: string, from: string, to: string): Promise<string>;
  detectLanguage(text: string): Promise<string>;
  getAlternatives(text: string, from: string, to: string): Promise<string[]>;
}
```

**Usage:**
```typescript
const translationService = getService('translation-service');

const translation = await translationService.translate(
  'Hello, how are you?',
  'en',
  'es'
);
// Returns: "Hola, ¿cómo estás?"
```

## Hook APIs

### useModule

Access module context within components:

```typescript
function useModule<T>(): T
```

**Usage:**
```typescript
const { state, actions } = useModule<DailyNewsModuleContext>();
```

### useModuleConfig

Access module configuration:

```typescript
function useModuleConfig(): ModuleConfig
```

**Usage:**
```typescript
const config = useModuleConfig();
console.log(`Module: ${config.name}`);
```

### useSharedService

Access shared services:

```typescript
function useSharedService<T>(serviceName: string): T
```

**Usage:**
```typescript
const aiService = useSharedService<AIService>('ai-service');
```

## Event System API

### ModuleEventBus

Communication between modules:

```typescript
interface ModuleEventBus {
  emit(event: string, data?: any): void;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  once(event: string, handler: EventHandler): void;
}

type EventHandler = (data?: any) => void;
```

**Usage:**
```typescript
// In Module A
eventBus.emit('vocabulary-learned', {
  words: ['hola', 'adiós'],
  moduleId: 'free-practice'
});

// In Module B
eventBus.on('vocabulary-learned', (data) => {
  console.log(`New words learned: ${data.words.join(', ')}`);
});
```

### Common Events

Standard events emitted by modules:

```typescript
// Module lifecycle events
'module:initialized' - { moduleId: string }
'module:activated' - { moduleId: string }
'module:deactivated' - { moduleId: string }
'module:error' - { moduleId: string, error: Error }

// Learning events
'lesson:started' - { moduleId: string, lessonId: string }
'lesson:completed' - { moduleId: string, lessonId: string, score: number }
'vocabulary:learned' - { words: string[], moduleId: string }
'achievement:earned' - { achievementId: string, moduleId: string }

// User events
'user:levelChanged' - { oldLevel: string, newLevel: string }
'user:streakUpdated' - { streak: number }
```

## Storage API

### ModuleStorage

Persistent storage for modules:

```typescript
interface ModuleStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

**Usage:**
```typescript
const storage = useModuleStorage();

// Save user preferences
await storage.set('preferences', {
  difficulty: 'intermediate',
  voiceEnabled: true
});

// Retrieve preferences
const prefs = await storage.get('preferences');
```

## Error Handling

### ModuleError

Standard error class for modules:

```typescript
class ModuleError extends Error {
  constructor(
    message: string,
    public code: string,
    public moduleId: string,
    public details?: any
  ) {
    super(message);
  }
}
```

**Usage:**
```typescript
throw new ModuleError(
  'Failed to load articles',
  'LOAD_FAILED',
  'daily-news',
  { statusCode: 404 }
);
```

### Error Codes

Standard error codes:

```typescript
const ErrorCodes = {
  INITIALIZATION_FAILED: 'MODULE_INIT_FAILED',
  DEPENDENCY_MISSING: 'MODULE_DEP_MISSING',
  PERMISSION_DENIED: 'MODULE_PERM_DENIED',
  CONFIGURATION_INVALID: 'MODULE_CONFIG_INVALID',
  SERVICE_UNAVAILABLE: 'MODULE_SERVICE_UNAVAILABLE'
} as const;
```

## Utility Functions

### validateModuleConfig

Validate module configuration:

```typescript
function validateModuleConfig(config: any): config is ModuleConfig
```

**Usage:**
```typescript
if (!validateModuleConfig(config)) {
  throw new Error('Invalid module configuration');
}
```

### checkPermissions

Check if user has required permissions:

```typescript
function checkPermissions(
  required: Permission[],
  user: User
): boolean
```

**Usage:**
```typescript
if (!checkPermissions(module.config.permissions, currentUser)) {
  return <AccessDenied />;
}
```

### formatModuleRoute

Format module route with parameters:

```typescript
function formatModuleRoute(
  route: string,
  params?: Record<string, string>
): string
```

**Usage:**
```typescript
const route = formatModuleRoute('/module/:id/lesson/:lessonId', {
  id: 'daily-news',
  lessonId: '123'
});
// Returns: '/module/daily-news/lesson/123'
```

## Best Practices

1. **Type Safety**: Always use TypeScript interfaces
2. **Error Handling**: Use try-catch blocks in lifecycle methods
3. **Resource Cleanup**: Always clean up in deactivate()
4. **Event Naming**: Use consistent event naming patterns
5. **Service Dependencies**: Declare all dependencies in config

## Examples

### Complete Module Implementation

```typescript
import { Module, ModuleConfig } from '@/core/types/module';

const config: ModuleConfig = {
  id: 'vocabulary-builder',
  name: 'Vocabulary Builder',
  description: 'Build your Spanish vocabulary',
  icon: 'book',
  route: '/vocabulary',
  permissions: ['basic_user'],
  dependencies: ['ai-service', 'progress-service']
};

export const VocabularyModule: Module = {
  config,
  
  async initialize() {
    console.log('Initializing Vocabulary Module');
  },
  
  async activate() {
    const progressService = getService('progress-service');
    await progressService.trackActivity({
      userId: getCurrentUser().id,
      moduleId: config.id,
      type: 'module_activated',
      duration: 0
    });
  },
  
  async deactivate() {
    // Save current progress
    await this.saveProgress();
  },
  
  Component: VocabularyBuilder,
  
  services: {
    vocabularyService: new VocabularyService()
  }
};
```