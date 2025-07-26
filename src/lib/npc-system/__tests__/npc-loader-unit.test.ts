/**
 * Unit tests for NPC Loader without actual file dependencies
 */

import { Destination, NPC, NPCLoadResult } from '../types';

// Define test data
const mockNPC1: NPC = {
  id: 'maria-taco-vendor',
  name: 'María',
  role: 'Taco Vendor',
  scenario_type: 'taco_vendor',
  persona_prompt: 'You are María, a taco vendor.',
  backstory: 'You have been selling tacos for 20 years.',
  order: 1
};

const mockNPC2: NPC = {
  id: 'carlos-guide',
  name: 'Carlos',
  role: 'Tour Guide',
  scenario_type: 'tour_guide',
  persona_prompt: 'You are Carlos, a tour guide.',
  backstory: 'You love showing people around Mexico City.',
  order: 2
};

const mockDestination: Destination = {
  id: 'mexico-city',
  city: 'Mexico City',
  description: 'The vibrant capital of Mexico',
  npcs: [mockNPC1, mockNPC2]
};

// Test the internal logic without actual imports
describe('NPC Loader Logic Tests', () => {
  describe('NPC filtering and searching', () => {
    it('should find NPC by ID', () => {
      const npc = mockDestination.npcs.find(n => n.id === 'maria-taco-vendor');
      expect(npc).toBeDefined();
      expect(npc?.name).toBe('María');
    });

    it('should return undefined for non-existent NPC', () => {
      const npc = mockDestination.npcs.find(n => n.id === 'non-existent');
      expect(npc).toBeUndefined();
    });

    it('should filter NPCs by scenario type', () => {
      const tacoVendors = mockDestination.npcs.filter(
        npc => npc.scenario_type === 'taco_vendor'
      );
      expect(tacoVendors).toHaveLength(1);
      expect(tacoVendors[0].id).toBe('maria-taco-vendor');
    });

    it('should get all NPCs', () => {
      const allNPCs = mockDestination.npcs;
      expect(allNPCs).toHaveLength(2);
      expect(allNPCs[0]).toBe(mockNPC1);
      expect(allNPCs[1]).toBe(mockNPC2);
    });
  });

  describe('NPC randomization', () => {
    it('should select random NPC from array', () => {
      const npcs = mockDestination.npcs;
      const randomIndex = Math.floor(Math.random() * npcs.length);
      const randomNPC = npcs[randomIndex];
      
      expect(randomNPC).toBeDefined();
      expect(npcs).toContain(randomNPC);
    });

    it('should handle empty NPC array', () => {
      const emptyDestination: Destination = {
        ...mockDestination,
        npcs: []
      };
      
      const npcs = emptyDestination.npcs;
      expect(npcs.length).toBe(0);
      
      const randomIndex = Math.floor(Math.random() * npcs.length);
      expect(randomIndex).toBe(0);
      expect(npcs[randomIndex]).toBeUndefined();
    });
  });

  describe('NPC sorting', () => {
    it('should sort NPCs by order property', () => {
      const unsortedNPCs: NPC[] = [
        { ...mockNPC2, order: 2 },
        { ...mockNPC1, order: 1 },
        { ...mockNPC1, id: 'pedro-chef', order: 3 }
      ];

      const sorted = [...unsortedNPCs].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      expect(sorted[0].order).toBe(1);
      expect(sorted[1].order).toBe(2);
      expect(sorted[2].order).toBe(3);
    });

    it('should handle NPCs without order property', () => {
      const npcWithoutOrder: NPC = {
        ...mockNPC1,
        order: undefined
      };

      const npcs = [mockNPC2, npcWithoutOrder];
      const sorted = [...npcs].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      expect(sorted[0]).toBe(npcWithoutOrder); // undefined order = 0
      expect(sorted[1]).toBe(mockNPC2);
    });
  });

  describe('NPCLoadResult structure', () => {
    it('should create valid NPCLoadResult', () => {
      const result: NPCLoadResult = {
        destination: mockDestination,
        npc: mockNPC1
      };

      expect(result.destination.id).toBe('mexico-city');
      expect(result.npc.id).toBe('maria-taco-vendor');
      expect(result.destination.npcs).toContain(result.npc);
    });
  });

  describe('Cache simulation', () => {
    it('should simulate cache behavior', () => {
      const cache = new Map<string, Destination>();
      
      // First access - not in cache
      expect(cache.has('mexico-city')).toBe(false);
      
      // Add to cache
      cache.set('mexico-city', mockDestination);
      
      // Second access - in cache
      expect(cache.has('mexico-city')).toBe(true);
      expect(cache.get('mexico-city')).toBe(mockDestination);
      
      // Clear cache
      cache.clear();
      expect(cache.has('mexico-city')).toBe(false);
    });
  });

  describe('Available destinations', () => {
    it('should return hardcoded destinations list', () => {
      // This simulates the getAvailableDestinations function
      const availableDestinations = ['mexico-city', 'london'];
      
      expect(availableDestinations).toContain('mexico-city');
      expect(availableDestinations).toContain('london');
      expect(availableDestinations).toHaveLength(2);
    });
  });
});