import { EventEmitter } from 'events';
import type { LearningModule } from './types';
import { ModuleRegistry } from './ModuleRegistry';

// TODO: Define ModuleContext type
interface ModuleContext {
  userId: string;
  language?: string;
  moduleProgress?: any;
  sessionId?: string;
  startTime?: number;
}

interface LifecycleState {
  currentModuleId: string | null;
  isTransitioning: boolean;
  context: ModuleContext | null;
}

type LifecycleEvent = 
  | 'moduleActivated'
  | 'moduleDeactivated'
  | 'moduleError'
  | 'transitionStart'
  | 'transitionEnd';

export class ModuleLifecycle extends EventEmitter {
  private state: LifecycleState = {
    currentModuleId: null,
    isTransitioning: false,
    context: null
  };
  
  private registry: ModuleRegistry;
  private errorCounts: Map<string, number> = new Map();
  private readonly MAX_ERROR_RETRIES = 3;

  constructor(registry: ModuleRegistry) {
    super();
    this.registry = registry;
  }

  async initializeModules(): Promise<void> {
    const modules = this.registry.getAllModules();
    const errors: Array<{ id: string; error: Error }> = [];

    for (const module of modules) {
      try {
        // Initialize module
        await module.initialize({
          difficulty: module.defaultDifficulty,
          enableHints: true,
          enableAudio: true,
          sessionDuration: 15
        });
      } catch (error) {
        errors.push({ id: module.id, error: error as Error });
      }
    }

    if (errors.length > 0) {
      console.error('Module initialization errors:', errors);
      this.emit('moduleError', { phase: 'init', errors });
    }
  }

  async activateModule(moduleId: string, userId?: string): Promise<void> {
    if (this.state.isTransitioning) {
      throw new Error('Module transition already in progress');
    }

    const module = this.registry.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      this.state.isTransitioning = true;
      this.emit('transitionStart', { to: moduleId });

      // Deactivate current module if exists
      if (this.state.currentModuleId) {
        await this.deactivateCurrentModule();
      }

      // Create context for new module
      const context: ModuleContext = {
        userId: userId || 'anonymous',
        sessionId: crypto.randomUUID(),
        startTime: Date.now()
      };

      // Start the module session
      await module.start({
        id: context.sessionId || crypto.randomUUID(),
        moduleId,
        userId: context.userId,
        startTime: new Date(),
        progress: 0,
        errors: 0
      });

      this.state.currentModuleId = moduleId;
      this.state.context = context;
      this.errorCounts.set(moduleId, 0);

      this.emit('moduleActivated', { moduleId, context });
    } catch (error) {
      this.handleModuleError(moduleId, error as Error);
      throw error;
    } finally {
      this.state.isTransitioning = false;
      this.emit('transitionEnd', { to: moduleId });
    }
  }

  async deactivateCurrentModule(): Promise<void> {
    if (!this.state.currentModuleId) return;

    const moduleId = this.state.currentModuleId;
    const module = this.registry.getModule(moduleId);

    if (module) {
      try {
        module.pause();
      } catch (error) {
        console.error(`Error deactivating module ${moduleId}:`, error);
        this.emit('moduleError', { moduleId, error, phase: 'deactivate' });
      }
    }

    this.state.currentModuleId = null;
    this.state.context = null;
    this.emit('moduleDeactivated', { moduleId });
  }

  async switchModule(fromId: string, toId: string, userId?: string): Promise<void> {
    if (this.state.currentModuleId !== fromId) {
      throw new Error(`Current module is not ${fromId}`);
    }

    await this.activateModule(toId, userId);
  }

  handleModuleError(moduleId: string, error: Error): void {
    const errorCount = (this.errorCounts.get(moduleId) || 0) + 1;
    this.errorCounts.set(moduleId, errorCount);

    this.emit('moduleError', {
      moduleId,
      error,
      errorCount,
      willRetry: errorCount < this.MAX_ERROR_RETRIES
    });

    console.error(`Module ${moduleId} error (${errorCount}/${this.MAX_ERROR_RETRIES}):`, error);
  }

  async recoverFromError(moduleId: string): Promise<void> {
    const errorCount = this.errorCounts.get(moduleId) || 0;

    if (errorCount >= this.MAX_ERROR_RETRIES) {
      // Fallback to a safe module or deactivate
      await this.deactivateCurrentModule();
      throw new Error(`Module ${moduleId} exceeded max retries`);
    }

    try {
      await this.activateModule(moduleId, this.state.context?.userId);
    } catch (retryError) {
      // If recovery fails, deactivate and propagate error
      await this.deactivateCurrentModule();
      throw retryError;
    }
  }

  getCurrentModule(): LearningModule | null {
    if (!this.state.currentModuleId) return null;
    return this.registry.getModule(this.state.currentModuleId);
  }

  getCurrentModuleId(): string | null {
    return this.state.currentModuleId;
  }

  isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  async cleanup(): Promise<void> {
    await this.deactivateCurrentModule();
    
    const modules = this.registry.getAllModules();
    // Modules don't have cleanup method in current interface
    // TODO: Add cleanup to LearningModule interface if needed

    this.removeAllListeners();
  }
}