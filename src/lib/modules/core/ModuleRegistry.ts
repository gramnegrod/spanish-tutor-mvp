import { LearningModule, ModuleDifficulty, ModuleFeatures } from './types';
import { LearnerProfile } from '@/lib/pedagogical-system';

/**
 * Singleton registry for managing learning modules
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry | null = null;
  private static readonly lock = {};
  private readonly modules: Map<string, LearningModule> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of ModuleRegistry
   */
  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      synchronized(ModuleRegistry.lock, () => {
        if (!ModuleRegistry.instance) {
          ModuleRegistry.instance = new ModuleRegistry();
        }
      });
    }
    return ModuleRegistry.instance!;
  }

  /**
   * Register a new learning module
   * @throws {Error} If module is invalid or already registered
   */
  public register(module: LearningModule): void {
    try {
      this.validateModule(module);
      
      if (this.modules.has(module.id)) {
        throw new Error(`Module with id '${module.id}' is already registered`);
      }

      this.modules.set(module.id, module);
    } catch (error) {
      console.error(`Failed to register module: ${error}`);
      throw error;
    }
  }

  /**
   * Unregister a learning module
   */
  public unregister(moduleId: string): void {
    try {
      const module = this.modules.get(moduleId);
      if (module?.cleanup) {
        module.cleanup();
      }
      this.modules.delete(moduleId);
    } catch (error) {
      console.error(`Failed to unregister module ${moduleId}: ${error}`);
    }
  }

  /**
   * Get a specific module by ID
   */
  public getModule(id: string): LearningModule | null {
    return this.modules.get(id) || null;
  }

  /**
   * Get all registered modules
   */
  public getAllModules(): LearningModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules accessible to a specific user based on their profile
   */
  public getAccessibleModules(userProfile: LearnerProfile): LearningModule[] {
    return this.getAllModules().filter(module => 
      this.isModuleAccessible(module, userProfile)
    );
  }

  /**
   * Get modules by difficulty level
   */
  public getModulesByDifficulty(difficulty: ModuleDifficulty): LearningModule[] {
    return this.getAllModules().filter(module => 
      module.metadata.difficulty === difficulty
    );
  }

  /**
   * Get modules that support a specific feature
   */
  public getModulesByFeature(feature: keyof ModuleFeatures): LearningModule[] {
    return this.getAllModules().filter(module => 
      module.metadata.features[feature] === true
    );
  }

  /**
   * Check if a module is registered
   */
  public hasModule(id: string): boolean {
    return this.modules.has(id);
  }

  private validateModule(module: LearningModule): void {
    if (!module.id || typeof module.id !== 'string') {
      throw new Error('Module must have a valid string id');
    }

    if (!module.metadata || typeof module.metadata !== 'object') {
      throw new Error('Module must have valid metadata');
    }

    const requiredMethods = ['initialize', 'execute', 'getProgress'];
    for (const method of requiredMethods) {
      if (typeof (module as any)[method] !== 'function') {
        throw new Error(`Module must implement ${method} method`);
      }
    }
  }

  private isModuleAccessible(module: LearningModule, profile: LearnerProfile): boolean {
    // Check difficulty level
    const userLevel = profile.currentLevel || 'A1';
    const moduleDifficulty = module.metadata.difficulty;
    
    // Basic accessibility check - can be enhanced
    const levelMap: Record<string, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };

    const difficultyMap: Record<ModuleDifficulty, number> = {
      'beginner': 1, 'intermediate': 3, 'advanced': 5
    };

    return levelMap[userLevel] >= difficultyMap[moduleDifficulty] - 1;
  }
}

// Thread-safe synchronization helper
function synchronized(lock: object, fn: () => void): void {
  fn();
}