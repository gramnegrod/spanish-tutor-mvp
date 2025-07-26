/**
 * Tests for Vocabulary Extractor
 */

import {
  extractFromNPC,
  extractFromNPCs,
  extractFromDestination,
  getScenarioVocabulary,
  VocabularySet
} from '../vocabulary-extractor';
import { NPC, Destination } from '../types';

describe('Vocabulary Extractor', () => {
  const mockNPC1: NPC = {
    id: 'maria-taco-vendor',
    name: 'María',
    role: 'Taco Vendor',
    persona_prompt: 'You are María',
    backstory: 'Taco vendor for 20 years',
    vocabulary_focus: ['taco', 'salsa', 'carne', 'pollo', 'tortilla'],
    sample_qa: 'Q: ¿Qué tacos tienes? A: Tenemos al pastor, carnitas, bistec y pollo. ¿Cuál quiere, güero?',
    tour_guide_story: '¡Bienvenidos! ¿Quieren probar los mejores tacos? "¡Están buenísimos!"',
    quirks: ['Always says "órale" when excited', 'Calls everyone "güero" or "güerita"'],
    scenario_type: 'taco_vendor'
  };

  const mockNPC2: NPC = {
    id: 'carlos-guide',
    name: 'Carlos',
    role: 'Tour Guide',
    persona_prompt: 'You are Carlos',
    backstory: 'Professional tour guide',
    vocabulary_focus: ['museo', 'historia', 'cultura'],
    sample_qa: 'Q: ¿Cuánto cuesta? A: La entrada cuesta cincuenta pesos.',
    tour_guide_story: '¡Vamos a explorar! "Esta ciudad es increíble"',
    quirks: ['Uses "híjole" when surprised'],
    scenario_type: 'tour_guide'
  };

  const mockDestination: Destination = {
    id: 'mexico-city',
    city: 'Mexico City',
    description: 'Capital of Mexico',
    npcs: [mockNPC1, mockNPC2],
    vocabulary_categories: {
      greetings: {
        formal: ['buenos días', 'buenas tardes'],
        informal: ['qué onda', 'qué tal']
      },
      food: {
        dishes: ['tacos', 'quesadillas', 'enchiladas']
      }
    }
  };

  describe('extractFromNPC', () => {
    it('should extract all vocabulary types from an NPC', () => {
      const vocab = extractFromNPC(mockNPC1);

      // Essential vocabulary from vocabulary_focus
      expect(vocab.essential).toContain('taco');
      expect(vocab.essential).toContain('salsa');
      expect(vocab.essential).toContain('tortilla');
      expect(vocab.essential).toHaveLength(5);

      // Contextual words from sample_qa
      expect(vocab.contextual).toContain('tacos');
      expect(vocab.contextual).toContain('pastor');
      expect(vocab.contextual).toContain('carnitas');
      expect(vocab.contextual).toContain('bistec');

      // Phrases from tour_guide_story
      expect(vocab.phrases).toContain('¡Bienvenidos!');
      expect(vocab.phrases).toContain('¿Quieren probar los mejores tacos?');
      expect(vocab.phrases).toContain('"¡Están buenísimos!"');

      // Cultural words from quirks
      expect(vocab.cultural).toContain('órale');
      expect(vocab.cultural).toContain('güero');
      expect(vocab.cultural).toContain('güerita');
    });

    it('should handle NPC with minimal data', () => {
      const minimalNPC: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        persona_prompt: 'Test',
        backstory: 'Test'
      };

      const vocab = extractFromNPC(minimalNPC);

      expect(vocab.essential).toEqual([]);
      expect(vocab.contextual).toEqual([]);
      expect(vocab.cultural).toEqual([]);
      expect(vocab.phrases).toEqual([]);
    });

    it('should remove duplicates within categories', () => {
      const npcWithDuplicates: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        persona_prompt: 'Test',
        backstory: 'Test',
        vocabulary_focus: ['taco', 'taco', 'salsa', 'salsa'],
        sample_qa: 'taco taco salsa salsa'
      };

      const vocab = extractFromNPC(npcWithDuplicates);

      expect(vocab.essential).toEqual(['taco', 'salsa']);
      expect(vocab.contextual).toContain('taco');
      expect(vocab.contextual).toContain('salsa');
      // Check no duplicates
      expect(vocab.contextual.filter(w => w === 'taco')).toHaveLength(1);
    });

    it('should filter out common English words', () => {
      const npcWithMixedLanguage: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        persona_prompt: 'Test',
        backstory: 'Test',
        sample_qa: 'The taco is good and the salsa are spicy'
      };

      const vocab = extractFromNPC(npcWithMixedLanguage);

      expect(vocab.contextual).toContain('taco');
      expect(vocab.contextual).toContain('salsa');
      expect(vocab.contextual).toContain('good');
      expect(vocab.contextual).toContain('spicy');
      expect(vocab.contextual).not.toContain('the');
      expect(vocab.contextual).not.toContain('is');
      expect(vocab.contextual).not.toContain('and');
      expect(vocab.contextual).not.toContain('are');
    });

    it('should extract questions and exclamations as phrases', () => {
      const npc: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        persona_prompt: 'Test',
        backstory: 'Test',
        tour_guide_story: '¿Cómo están? ¡Qué bueno verlos! Normal text. ¿Les gusta México? ¡Vamos!'
      };

      const vocab = extractFromNPC(npc);

      expect(vocab.phrases).toContain('¿Cómo están?');
      expect(vocab.phrases).toContain('¡Qué bueno verlos!');
      expect(vocab.phrases).toContain('¿Les gusta México?');
      expect(vocab.phrases).toContain('¡Vamos!');
      expect(vocab.phrases).not.toContain('Normal text'); // Too short
    });
  });

  describe('extractFromNPCs', () => {
    it('should combine vocabulary from multiple NPCs', () => {
      const vocab = extractFromNPCs([mockNPC1, mockNPC2]);

      // Should have vocabulary from both NPCs
      expect(vocab.essential).toContain('taco'); // from NPC1
      expect(vocab.essential).toContain('museo'); // from NPC2
      expect(vocab.cultural).toContain('órale'); // from NPC1
      expect(vocab.cultural).toContain('híjole'); // from NPC2
    });

    it('should remove duplicates across NPCs', () => {
      const npc1: NPC = {
        ...mockNPC1,
        vocabulary_focus: ['taco', 'salsa']
      };
      const npc2: NPC = {
        ...mockNPC2,
        vocabulary_focus: ['taco', 'museo'] // 'taco' is duplicate
      };

      const vocab = extractFromNPCs([npc1, npc2]);

      // 'taco' should appear only once
      expect(vocab.essential.filter(w => w === 'taco')).toHaveLength(1);
      expect(vocab.essential).toContain('salsa');
      expect(vocab.essential).toContain('museo');
    });

    it('should handle empty NPC array', () => {
      const vocab = extractFromNPCs([]);

      expect(vocab.essential).toEqual([]);
      expect(vocab.contextual).toEqual([]);
      expect(vocab.cultural).toEqual([]);
      expect(vocab.phrases).toEqual([]);
    });
  });

  describe('extractFromDestination', () => {
    it('should extract vocabulary from NPCs and destination categories', () => {
      const vocab = extractFromDestination(mockDestination);

      // From NPCs
      expect(vocab.essential).toContain('taco');
      expect(vocab.essential).toContain('museo');

      // From destination vocabulary categories
      expect(vocab.contextual).toContain('buenos días');
      expect(vocab.contextual).toContain('qué onda');
      expect(vocab.contextual).toContain('tacos');
      expect(vocab.contextual).toContain('enchiladas');
    });

    it('should handle destination without vocabulary categories', () => {
      const destinationWithoutCategories: Destination = {
        ...mockDestination,
        vocabulary_categories: undefined
      };

      const vocab = extractFromDestination(destinationWithoutCategories);

      // Should still have NPC vocabulary
      expect(vocab.essential).toContain('taco');
      expect(vocab.essential).toContain('museo');
    });

    it('should remove duplicates between NPCs and categories', () => {
      const destination: Destination = {
        ...mockDestination,
        vocabulary_categories: {
          food: {
            common: ['taco', 'salsa'] // Duplicates from NPC vocabulary
          }
        }
      };

      const vocab = extractFromDestination(destination);

      // Should not have duplicates
      expect(vocab.essential.filter(w => w === 'taco')).toHaveLength(1);
      expect(vocab.contextual.filter(w => w === 'taco')).toHaveLength(1);
    });
  });

  describe('getScenarioVocabulary', () => {
    it('should extract vocabulary for specific scenario type', () => {
      const vocab = getScenarioVocabulary(mockDestination, 'taco_vendor');

      // Should only have vocabulary from taco vendor NPC
      expect(vocab.essential).toContain('taco');
      expect(vocab.essential).toContain('salsa');
      expect(vocab.essential).not.toContain('museo'); // This is from tour guide

      expect(vocab.cultural).toContain('órale');
      expect(vocab.cultural).not.toContain('híjole'); // This is from tour guide
    });

    it('should return empty vocabulary for non-existent scenario', () => {
      const vocab = getScenarioVocabulary(mockDestination, 'non_existent');

      expect(vocab.essential).toEqual([]);
      expect(vocab.contextual).toEqual([]);
      expect(vocab.cultural).toEqual([]);
      expect(vocab.phrases).toEqual([]);
    });

    it('should handle multiple NPCs with same scenario type', () => {
      const destination: Destination = {
        ...mockDestination,
        npcs: [
          { ...mockNPC1, scenario_type: 'food' },
          { ...mockNPC2, scenario_type: 'food', vocabulary_focus: ['restaurante', 'menú'] }
        ]
      };

      const vocab = getScenarioVocabulary(destination, 'food');

      // Should have vocabulary from both NPCs
      expect(vocab.essential).toContain('taco');
      expect(vocab.essential).toContain('restaurante');
      expect(vocab.essential).toContain('menú');
    });
  });

  describe('Edge cases and special characters', () => {
    it('should handle Spanish special characters correctly', () => {
      const npc: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        persona_prompt: 'Test',
        backstory: 'Test',
        vocabulary_focus: ['niño', 'año', 'español'],
        sample_qa: 'El niño pequeño habla español'
      };

      const vocab = extractFromNPC(npc);

      expect(vocab.essential).toContain('niño');
      expect(vocab.essential).toContain('año');
      expect(vocab.essential).toContain('español');
      expect(vocab.contextual).toContain('niño');
      expect(vocab.contextual).toContain('pequeño');
      expect(vocab.contextual).toContain('español');
    });

    it('should handle quoted phrases correctly', () => {
      const npc: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        persona_prompt: 'Test',
        backstory: 'Test',
        tour_guide_story: 'He said "Buenos días, amigos" and then "¿Cómo están ustedes?"'
      };

      const vocab = extractFromNPC(npc);

      expect(vocab.phrases).toContain('"Buenos días, amigos"');
      expect(vocab.phrases).toContain('"¿Cómo están ustedes?"');
    });

    it('should extract all cultural markers from quirks', () => {
      const npc: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test',
        persona_prompt: 'Test',
        backstory: 'Test',
        quirks: [
          'Says "órale" when excited',
          'Calls people "güero" or "maestro"',
          'Uses "híjole" and "ándale"',
          'Thinks everything is "chido" or "padrísimo"',
          'Always asks "qué onda"'
        ]
      };

      const vocab = extractFromNPC(npc);

      const expectedCultural = ['órale', 'güero', 'maestro', 'híjole', 'ándale', 'chido', 'padrísimo', 'qué onda'];
      expectedCultural.forEach(word => {
        expect(vocab.cultural).toContain(word);
      });
    });
  });
});