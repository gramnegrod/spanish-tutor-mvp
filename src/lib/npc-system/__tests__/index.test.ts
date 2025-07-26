/**
 * Tests for NPC System index exports
 */

import * as NPCSystem from '../index';

describe('NPC System Exports', () => {
  it('should export all type definitions', () => {
    // Type exports (we can't test types directly, but we can check they're exported)
    expect(NPCSystem).toBeDefined();
  });

  it('should export all npc-loader functions', () => {
    expect(NPCSystem.loadDestination).toBeDefined();
    expect(typeof NPCSystem.loadDestination).toBe('function');
    
    expect(NPCSystem.getNPC).toBeDefined();
    expect(typeof NPCSystem.getNPC).toBe('function');
    
    expect(NPCSystem.getAllNPCs).toBeDefined();
    expect(typeof NPCSystem.getAllNPCs).toBe('function');
    
    expect(NPCSystem.getAvailableDestinations).toBeDefined();
    expect(typeof NPCSystem.getAvailableDestinations).toBe('function');
  });

  it('should export all npc-prompt-builder functions', () => {
    expect(NPCSystem.buildPrompt).toBeDefined();
    expect(typeof NPCSystem.buildPrompt).toBe('function');
    
    expect(NPCSystem.addScenarioContext).toBeDefined();
    expect(typeof NPCSystem.addScenarioContext).toBe('function');
  });

  it('should export all vocabulary-extractor functions', () => {
    expect(NPCSystem.extractFromNPC).toBeDefined();
    expect(typeof NPCSystem.extractFromNPC).toBe('function');
    
    expect(NPCSystem.extractFromDestination).toBeDefined();
    expect(typeof NPCSystem.extractFromDestination).toBe('function');
    
    expect(NPCSystem.getScenarioVocabulary).toBeDefined();
    expect(typeof NPCSystem.getScenarioVocabulary).toBe('function');
  });

  it('should maintain function signatures', () => {
    // Test that functions have expected arity (number of parameters)
    expect(NPCSystem.loadDestination.length).toBe(1); // destinationId
    expect(NPCSystem.getNPC.length).toBe(2); // destinationId, npcId
    expect(NPCSystem.getAllNPCs.length).toBe(1); // destinationId
    expect(NPCSystem.getAvailableDestinations.length).toBe(0); // no params
    
    expect(NPCSystem.buildPrompt.length).toBe(1); // config object
    expect(NPCSystem.addScenarioContext.length).toBe(2); // basePrompt, scenario
    
    expect(NPCSystem.extractFromNPC.length).toBe(1); // npc
    expect(NPCSystem.extractFromDestination.length).toBe(1); // destination
    expect(NPCSystem.getScenarioVocabulary.length).toBe(2); // destination, scenarioType
  });
});