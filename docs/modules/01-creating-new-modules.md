# Creating New Modules

This guide walks you through creating a new module for the Spanish Tutor MVP application.

## Prerequisites

- Understanding of React and TypeScript
- Familiarity with the module system (see [Module System Overview](./00-module-system-overview.md))
- Development environment setup

## Step-by-Step Guide

### Step 1: Plan Your Module

Before coding, define:
- **Purpose**: What specific learning goal does this module address?
- **Features**: What functionality will it provide?
- **Dependencies**: What shared services will it need?
- **UI Flow**: How will users interact with it?

### Step 2: Create Module Structure

```bash
# Create module directory structure
mkdir -p src/modules/your-module-name/{components,hooks,services,types,tests}
```

Required files:
```
src/modules/your-module-name/
├── index.ts           # Module entry point
├── config.ts          # Module configuration
├── components/        # React components
├── hooks/            # Custom React hooks
├── services/         # Business logic
├── types/            # TypeScript types
└── tests/            # Unit and integration tests
```

### Step 3: Define Module Configuration

Create `config.ts`:

```typescript
import { ModuleConfig } from '@/core/types/module';

export const moduleConfig: ModuleConfig = {
  id: 'your-module-name',
  name: 'Your Module Name',
  description: 'Brief description of what this module does',
  icon: 'icon-name', // Material-UI icon name
  route: '/your-module',
  permissions: ['basic_user'], // Required user permissions
  dependencies: ['ai-service'], // Required services
  settings: {
    // Module-specific settings
    enableFeatureX: true,
    maxItems: 10
  }
};
```

### Step 4: Create Module Interface

Define the module's public interface in `types/index.ts`:

```typescript
// Module state interface
export interface YourModuleState {
  isLoading: boolean;
  currentItem: Item | null;
  items: Item[];
  error: Error | null;
}

// Module actions
export interface YourModuleActions {
  loadItems: () => Promise<void>;
  selectItem: (id: string) => void;
  updateItem: (id: string, data: Partial<Item>) => Promise<void>;
}

// Module props passed to components
export interface YourModuleProps {
  state: YourModuleState;
  actions: YourModuleActions;
}
```

### Step 5: Implement Module Entry Point

Create `index.ts`:

```typescript
import { Module } from '@/core/types/module';
import { moduleConfig } from './config';
import { YourModuleProvider } from './components/YourModuleProvider';
import { yourModuleService } from './services/yourModuleService';

export const YourModule: Module = {
  config: moduleConfig,
  
  // Lifecycle hooks
  async initialize() {
    console.log('Initializing Your Module');
    await yourModuleService.setup();
  },
  
  async activate() {
    console.log('Activating Your Module');
    // Set up event listeners, timers, etc.
  },
  
  async deactivate() {
    console.log('Deactivating Your Module');
    // Clean up resources
  },
  
  // Main component
  Component: YourModuleProvider,
  
  // Exported services for other modules
  services: {
    yourModuleService
  }
};

// Export for module registry
export default YourModule;
```

### Step 6: Create Module Provider

Create `components/YourModuleProvider.tsx`:

```typescript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { YourModuleState, YourModuleActions } from '../types';
import { yourModuleReducer, initialState } from '../services/state';
import { YourModuleLayout } from './YourModuleLayout';

const YourModuleContext = createContext<{
  state: YourModuleState;
  actions: YourModuleActions;
} | null>(null);

export const useYourModule = () => {
  const context = useContext(YourModuleContext);
  if (!context) {
    throw new Error('useYourModule must be used within YourModuleProvider');
  }
  return context;
};

export const YourModuleProvider: React.FC = () => {
  const [state, dispatch] = useReducer(yourModuleReducer, initialState);
  
  const actions: YourModuleActions = {
    loadItems: async () => {
      dispatch({ type: 'LOAD_ITEMS_START' });
      try {
        const items = await yourModuleService.fetchItems();
        dispatch({ type: 'LOAD_ITEMS_SUCCESS', payload: items });
      } catch (error) {
        dispatch({ type: 'LOAD_ITEMS_ERROR', payload: error });
      }
    },
    // ... other actions
  };
  
  useEffect(() => {
    actions.loadItems();
  }, []);
  
  return (
    <YourModuleContext.Provider value={{ state, actions }}>
      <YourModuleLayout />
    </YourModuleContext.Provider>
  );
};
```

### Step 7: Implement Core Components

Create main layout component:

```typescript
// components/YourModuleLayout.tsx
import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useYourModule } from './YourModuleProvider';
import { ItemList } from './ItemList';
import { ItemDetail } from './ItemDetail';

export const YourModuleLayout: React.FC = () => {
  const { state, actions } = useYourModule();
  
  return (
    <Container maxWidth="lg">
      <Box py={3}>
        <Typography variant="h4" gutterBottom>
          Your Module Name
        </Typography>
        
        {state.isLoading ? (
          <CircularProgress />
        ) : (
          <Box display="flex" gap={3}>
            <Box flex={1}>
              <ItemList 
                items={state.items}
                onSelect={actions.selectItem}
              />
            </Box>
            <Box flex={2}>
              {state.currentItem && (
                <ItemDetail 
                  item={state.currentItem}
                  onUpdate={actions.updateItem}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};
```

### Step 8: Implement Services

Create business logic in `services/yourModuleService.ts`:

```typescript
import { apiClient } from '@/core/services/api';
import { Item } from '../types';

class YourModuleService {
  private cache: Map<string, Item> = new Map();
  
  async setup() {
    // Initialize service
    console.log('Setting up Your Module Service');
  }
  
  async fetchItems(): Promise<Item[]> {
    const response = await apiClient.get('/api/your-module/items');
    const items = response.data;
    
    // Cache items
    items.forEach(item => this.cache.set(item.id, item));
    
    return items;
  }
  
  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    const response = await apiClient.patch(`/api/your-module/items/${id}`, data);
    const updated = response.data;
    
    // Update cache
    this.cache.set(id, updated);
    
    return updated;
  }
  
  getCachedItem(id: string): Item | undefined {
    return this.cache.get(id);
  }
}

export const yourModuleService = new YourModuleService();
```

### Step 9: Add Tests

Create comprehensive tests:

```typescript
// tests/YourModule.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourModuleProvider } from '../components/YourModuleProvider';
import { yourModuleService } from '../services/yourModuleService';

jest.mock('../services/yourModuleService');

describe('YourModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('loads items on mount', async () => {
    const mockItems = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ];
    
    (yourModuleService.fetchItems as jest.Mock).mockResolvedValue(mockItems);
    
    render(<YourModuleProvider />);
    
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });
  
  // More tests...
});
```

### Step 10: Register Your Module

Add to module registry in `src/core/module-registry/index.ts`:

```typescript
import YourModule from '@/modules/your-module-name';

export const moduleRegistry = {
  // ... existing modules
  'your-module-name': YourModule,
};
```

## Module Interface Requirements

Every module must implement:

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

## File Structure Conventions

### Component Files
- Use PascalCase: `YourComponent.tsx`
- Export named components
- Co-locate styles in same directory

### Service Files
- Use camelCase: `yourService.ts`
- Export singleton instances
- Keep API calls separate from business logic

### Type Files
- Group related types together
- Export all public types from `types/index.ts`
- Use descriptive names

## Testing Requirements

1. **Unit Tests**
   - Test all service methods
   - Test component behavior
   - Test state reducers

2. **Integration Tests**
   - Test module initialization
   - Test data flow
   - Test error handling

3. **Coverage Goals**
   - Minimum 80% code coverage
   - 100% coverage for critical paths
   - Test edge cases

## Example: Daily News Module

Here's a practical example of creating a Daily News module:

```typescript
// src/modules/daily-news/config.ts
export const dailyNewsConfig: ModuleConfig = {
  id: 'daily-news',
  name: 'Daily News',
  description: 'Learn Spanish through current events',
  icon: 'newspaper',
  route: '/daily-news',
  permissions: ['basic_user'],
  dependencies: ['ai-service', 'translation-service'],
  settings: {
    articlesPerDay: 5,
    difficultyLevels: ['beginner', 'intermediate', 'advanced'],
    categories: ['politics', 'technology', 'culture', 'sports']
  }
};

// src/modules/daily-news/types/index.ts
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  publishedAt: Date;
  readingTime: number;
  vocabulary: VocabularyItem[];
}

// src/modules/daily-news/components/ArticleReader.tsx
export const ArticleReader: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const { highlightVocabulary } = useDailyNews();
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {article.title}
      </Typography>
      <Box mb={2}>
        <Chip label={article.category} size="small" />
        <Chip label={article.difficulty} size="small" sx={{ ml: 1 }} />
      </Box>
      <Typography variant="body1" paragraph>
        {highlightVocabulary(article.content)}
      </Typography>
      <Button onClick={() => setShowTranslation(!showTranslation)}>
        {showTranslation ? 'Hide' : 'Show'} Translation
      </Button>
    </Paper>
  );
};
```

## Common Pitfalls

1. **Over-coupling**: Don't directly import from other modules
2. **State leakage**: Keep module state isolated
3. **Missing cleanup**: Always clean up in deactivate()
4. **Hardcoded values**: Use configuration instead
5. **Poor error handling**: Always handle edge cases

## Next Steps

- Review the [Module API Reference](./02-module-api-reference.md)
- See [Migration Guide](./03-migration-guide.md) for converting existing features
- Check example modules in `src/modules/` directory