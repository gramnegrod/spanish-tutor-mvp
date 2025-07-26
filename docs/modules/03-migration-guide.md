# Migration Guide

This guide helps you migrate existing features to the module system and maintain backwards compatibility during the transition.

## Overview

Migrating to the module system involves:
1. Wrapping existing features as modules
2. Maintaining backwards compatibility
3. Migrating data and state
4. Updating dependencies
5. Testing the migration

## Migration Strategy

### Phase 1: Analysis
- Identify features to migrate
- Map dependencies
- Plan data migration
- Create migration timeline

### Phase 2: Wrapper Implementation
- Create module wrapper
- Implement module interface
- Add configuration
- Maintain existing APIs

### Phase 3: Testing
- Test module in isolation
- Test backwards compatibility
- Test data migration
- Performance testing

### Phase 4: Deployment
- Feature flag rollout
- Monitor performance
- Gather user feedback
- Complete migration

## Step-by-Step Migration

### Step 1: Analyze Existing Feature

First, understand the current implementation:

```typescript
// Example: Existing Conversation Feature
// src/features/conversation/ConversationView.tsx
export const ConversationView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = async (text: string) => {
    setIsLoading(true);
    const response = await api.post('/conversation/message', { text });
    setMessages([...messages, response.data]);
    setIsLoading(false);
  };
  
  return (
    <div>
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};
```

### Step 2: Create Module Wrapper

Create a module that wraps the existing feature:

```typescript
// src/modules/conversation-legacy/index.ts
import { Module } from '@/core/types/module';
import { ConversationView } from '@/features/conversation/ConversationView';

const ConversationLegacyModule: Module = {
  config: {
    id: 'conversation-legacy',
    name: 'Conversation (Legacy)',
    description: 'Free-form Spanish conversation practice',
    icon: 'chat',
    route: '/conversation',
    permissions: ['basic_user'],
    dependencies: [],
    metadata: {
      isLegacy: true,
      migrationTarget: 'free-practice'
    }
  },
  
  // Wrap existing component
  Component: ConversationView,
  
  // Optional: Add lifecycle hooks
  async initialize() {
    console.log('Initializing legacy conversation module');
  }
};

export default ConversationLegacyModule;
```

### Step 3: Create Adapter Layer

Build adapters to bridge old and new systems:

```typescript
// src/modules/conversation-legacy/adapters/ServiceAdapter.ts
import { legacyApi } from '@/features/conversation/api';
import { AIService } from '@/core/services/ai-service';

export class LegacyServiceAdapter implements AIService {
  async startConversation(config: ConversationConfig) {
    // Map new interface to legacy API
    const session = await legacyApi.createSession({
      level: config.difficulty,
      topic: config.topic
    });
    
    return {
      id: session.sessionId,
      config,
      startedAt: new Date()
    };
  }
  
  async sendMessage(conversationId: string, message: string) {
    // Map to legacy format
    const response = await legacyApi.sendMessage({
      sessionId: conversationId,
      text: message
    });
    
    // Transform response to new format
    return {
      message: response.reply,
      corrections: this.transformCorrections(response.corrections),
      suggestions: response.hints
    };
  }
  
  private transformCorrections(legacy: any[]): Correction[] {
    return legacy.map(c => ({
      original: c.error,
      corrected: c.correction,
      explanation: c.reason
    }));
  }
}
```

### Step 4: Implement State Migration

Handle state and data migration:

```typescript
// src/modules/conversation-legacy/migration/StateMigrator.ts
export class StateMigrator {
  async migrateUserData(userId: string) {
    // Get legacy data
    const legacyData = await this.getLegacyData(userId);
    
    // Transform to new format
    const migratedData = {
      conversations: legacyData.sessions.map(session => ({
        id: session.id,
        startedAt: new Date(session.created),
        messages: this.migrateMessages(session.messages),
        metadata: {
          legacy: true,
          originalId: session.id
        }
      })),
      progress: {
        totalSessions: legacyData.stats.sessionCount,
        totalTime: legacyData.stats.totalMinutes * 60,
        wordsLearned: legacyData.vocabulary.length
      }
    };
    
    // Save in new format
    await this.saveModuleData(userId, migratedData);
    
    return migratedData;
  }
  
  private migrateMessages(legacyMessages: any[]) {
    return legacyMessages.map(msg => ({
      id: msg.id || generateId(),
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
      timestamp: new Date(msg.timestamp),
      corrections: msg.corrections || []
    }));
  }
}
```

### Step 5: Add Backwards Compatibility

Ensure old routes and APIs continue to work:

```typescript
// src/modules/conversation-legacy/compatibility/RouteCompat.ts
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const RouteCompatibilityWrapper: React.FC = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Redirect old routes to new module routes
    const routeMap: Record<string, string> = {
      '/old/conversation': '/modules/free-practice',
      '/chat': '/modules/free-practice',
      '/practice/free': '/modules/free-practice'
    };
    
    if (routeMap[location.pathname]) {
      navigate(routeMap[location.pathname], { replace: true });
    }
  }, [location.pathname]);
  
  return <>{children}</>;
};
```

### Step 6: Feature Flag Implementation

Use feature flags for gradual rollout:

```typescript
// src/modules/conversation-legacy/flags/FeatureFlags.ts
interface FeatureFlags {
  useNewConversationModule: boolean;
  migrateDataOnLogin: boolean;
  showMigrationBanner: boolean;
}

export const useFeatureFlags = (): FeatureFlags => {
  const user = useCurrentUser();
  
  return {
    useNewConversationModule: user?.flags?.includes('new_conversation'),
    migrateDataOnLogin: user?.flags?.includes('auto_migrate'),
    showMigrationBanner: !user?.preferences?.dismissedMigrationBanner
  };
};

// Usage in component
export const ConversationWrapper: React.FC = () => {
  const flags = useFeatureFlags();
  
  if (flags.useNewConversationModule) {
    return <FreePracticeModule />;
  }
  
  return (
    <>
      {flags.showMigrationBanner && <MigrationBanner />}
      <ConversationLegacyModule />
    </>
  );
};
```

## Data Migration Strategies

### 1. Lazy Migration

Migrate data when users access it:

```typescript
export const useLazyMigration = () => {
  const [migrated, setMigrated] = useState(false);
  const userId = useCurrentUser()?.id;
  
  useEffect(() => {
    if (userId && !migrated) {
      const migrate = async () => {
        const hasMigrated = await checkMigrationStatus(userId);
        if (!hasMigrated) {
          await migrateUserData(userId);
        }
        setMigrated(true);
      };
      migrate();
    }
  }, [userId]);
  
  return migrated;
};
```

### 2. Batch Migration

Migrate all users in batches:

```typescript
export class BatchMigrator {
  async migrateAllUsers(batchSize = 100) {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const users = await this.getUsers(offset, batchSize);
      
      if (users.length === 0) {
        hasMore = false;
        break;
      }
      
      // Migrate batch in parallel
      await Promise.all(
        users.map(user => this.migrateUser(user.id))
      );
      
      offset += batchSize;
      
      // Log progress
      console.log(`Migrated ${offset} users`);
      
      // Add delay to avoid overload
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### 3. Dual-Write Strategy

Write to both old and new systems during transition:

```typescript
export class DualWriteService {
  async saveMessage(message: Message) {
    // Write to new system
    await this.newStorage.save(message);
    
    // Also write to legacy system
    try {
      await this.legacyStorage.save(
        this.transformToLegacy(message)
      );
    } catch (error) {
      // Log but don't fail if legacy write fails
      console.error('Legacy write failed:', error);
    }
  }
  
  async getMessage(id: string) {
    // Try new system first
    let message = await this.newStorage.get(id);
    
    if (!message) {
      // Fallback to legacy
      const legacy = await this.legacyStorage.get(id);
      if (legacy) {
        message = this.transformFromLegacy(legacy);
        // Opportunistically migrate
        await this.newStorage.save(message);
      }
    }
    
    return message;
  }
}
```

## Testing Migration

### 1. Unit Tests for Adapters

```typescript
describe('LegacyServiceAdapter', () => {
  it('transforms legacy corrections correctly', async () => {
    const adapter = new LegacyServiceAdapter();
    const mockLegacyResponse = {
      reply: 'Hola',
      corrections: [{
        error: 'Ola',
        correction: 'Hola',
        reason: 'Missing "H"'
      }]
    };
    
    jest.spyOn(legacyApi, 'sendMessage')
      .mockResolvedValue(mockLegacyResponse);
    
    const result = await adapter.sendMessage('123', 'Ola');
    
    expect(result.corrections).toEqual([{
      original: 'Ola',
      corrected: 'Hola',
      explanation: 'Missing "H"'
    }]);
  });
});
```

### 2. Integration Tests

```typescript
describe('Module Migration Integration', () => {
  it('maintains backwards compatibility', async () => {
    // Test old route redirects
    const { history } = renderWithRouter(
      <App />,
      { route: '/old/conversation' }
    );
    
    await waitFor(() => {
      expect(history.location.pathname).toBe('/modules/free-practice');
    });
  });
  
  it('migrates user data correctly', async () => {
    const userId = 'test-user';
    await seedLegacyData(userId);
    
    const migrator = new StateMigrator();
    const result = await migrator.migrateUserData(userId);
    
    expect(result.conversations).toHaveLength(5);
    expect(result.progress.totalSessions).toBe(5);
  });
});
```

### 3. Performance Tests

```typescript
describe('Migration Performance', () => {
  it('handles large data sets efficiently', async () => {
    const largeDataSet = generateLargeDataSet(10000);
    const startTime = performance.now();
    
    const migrator = new BatchMigrator();
    await migrator.migrateData(largeDataSet);
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
```

## Common Migration Patterns

### 1. Wrapping Global State

Convert global state to module context:

```typescript
// Before: Global Redux store
const globalState = {
  conversation: {
    messages: [],
    isLoading: false
  }
};

// After: Module-scoped state
const ConversationModuleProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  );
};
```

### 2. API Endpoint Migration

Update API calls gradually:

```typescript
class APIService {
  async sendMessage(text: string) {
    // Check feature flag
    if (this.useNewAPI()) {
      return this.newAPI.post('/v2/messages', { content: text });
    }
    
    // Fallback to legacy
    const response = await this.legacyAPI.post('/conversation/message', { 
      text 
    });
    
    // Transform response
    return this.transformLegacyResponse(response);
  }
}
```

### 3. Event System Migration

Bridge old and new event systems:

```typescript
class EventBridge {
  constructor() {
    // Listen to legacy events
    legacyEventEmitter.on('message:sent', (data) => {
      // Emit in new format
      moduleEventBus.emit('conversation:message', {
        moduleId: 'conversation-legacy',
        message: data.text
      });
    });
    
    // Listen to new events
    moduleEventBus.on('conversation:message', (data) => {
      // Emit in legacy format if needed
      if (this.hasLegacyListeners()) {
        legacyEventEmitter.emit('message:sent', {
          text: data.message
        });
      }
    });
  }
}
```

## Migration Checklist

- [ ] **Analysis**
  - [ ] Document current implementation
  - [ ] Identify all dependencies
  - [ ] Map data structures
  - [ ] List API endpoints

- [ ] **Implementation**
  - [ ] Create module wrapper
  - [ ] Implement adapters
  - [ ] Add state migration
  - [ ] Ensure backwards compatibility

- [ ] **Testing**
  - [ ] Unit tests for adapters
  - [ ] Integration tests
  - [ ] Performance tests
  - [ ] User acceptance testing

- [ ] **Deployment**
  - [ ] Set up feature flags
  - [ ] Create rollback plan
  - [ ] Monitor performance
  - [ ] Gather user feedback

- [ ] **Cleanup**
  - [ ] Remove legacy code
  - [ ] Update documentation
  - [ ] Archive old data
  - [ ] Update dependencies

## Troubleshooting

### Common Issues

1. **State synchronization problems**
   - Use single source of truth
   - Implement proper state migration
   - Add logging for debugging

2. **Performance degradation**
   - Profile before and after
   - Optimize data transformations
   - Use caching where appropriate

3. **Missing functionality**
   - Audit all features before migration
   - Create comprehensive test suite
   - Maintain feature parity

### Debug Tools

```typescript
// Migration debug utility
export const MigrationDebugger = {
  logMigrationStatus: async (userId: string) => {
    const legacy = await getLegacyData(userId);
    const migrated = await getModuleData(userId);
    
    console.table({
      'Legacy Records': legacy.count,
      'Migrated Records': migrated.count,
      'Migration Complete': legacy.count === migrated.count
    });
  },
  
  validateMigration: async (userId: string) => {
    const issues = [];
    
    // Check data integrity
    const legacy = await getLegacyData(userId);
    const migrated = await getModuleData(userId);
    
    if (legacy.sessions.length !== migrated.conversations.length) {
      issues.push('Session count mismatch');
    }
    
    // More validation...
    
    return issues;
  }
};
```

## Next Steps

After migration:
1. Monitor system performance
2. Collect user feedback
3. Plan legacy code removal
4. Document lessons learned