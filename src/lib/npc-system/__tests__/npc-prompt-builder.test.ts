/**
 * Tests for NPC Prompt Builder
 */

import { buildPrompt, addScenarioContext } from '../npc-prompt-builder';
import { NPC, NPCPromptConfig } from '../types';

describe('NPC Prompt Builder', () => {
  const mockNPC: NPC = {
    id: 'maria-taco-vendor',
    name: 'María',
    role: 'Taco Vendor',
    persona_prompt: 'You are María, a friendly taco vendor in Mexico City.',
    backstory: 'You have been selling tacos for 20 years at the same corner.',
    personality: 'Warm, chatty, and proud of your cooking',
    quirks: ['Always calls customers "güero" or "güerita"', 'Loves to share cooking tips'],
    vocabulary_focus: ['taco', 'salsa', 'carne', 'pollo'],
    location: 'Corner of Insurgentes and Reforma',
    tour_guide_story: 'I sell the best tacos in the neighborhood!',
    current_events_2025: 'The new metro line has brought more customers.',
    prices_hours: 'Open 7am-3pm, tacos 15-25 pesos',
    sample_qa: 'Q: What tacos do you have? A: Tenemos al pastor, carnitas, y pollo.'
  };

  describe('buildPrompt', () => {
    it('should build a complete prompt with all NPC data', () => {
      const config: NPCPromptConfig = {
        npc: mockNPC,
        supportLevel: 'MODERATE_SUPPORT'
      };

      const prompt = buildPrompt(config);

      // Check that prompt includes key elements
      expect(prompt).toContain('You are María, a friendly taco vendor');
      expect(prompt).toContain('PERSONALITY: Warm, chatty, and proud of your cooking');
      expect(prompt).toContain('IMPORTANT QUIRKS TO MAINTAIN:');
      expect(prompt).toContain('Always calls customers "güero" or "güerita"');
      expect(prompt).toContain('BACKSTORY AND CONTEXT:');
      expect(prompt).toContain('20 years at the same corner');
      expect(prompt).toContain('You are currently at Corner of Insurgentes and Reforma');
      expect(prompt).toContain('BEHAVIORAL GUIDELINES:');
      expect(prompt).toContain('KEY VOCABULARY TO USE:');
      expect(prompt).toContain('taco, salsa, carne, pollo');
      expect(prompt).toContain('Never break character');
    });

    it('should handle minimal NPC data', () => {
      const minimalNPC: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test Role',
        persona_prompt: 'You are a test character.',
        backstory: 'Test backstory.'
      };

      const config: NPCPromptConfig = {
        npc: minimalNPC
      };

      const prompt = buildPrompt(config);

      expect(prompt).toContain('You are a test character');
      expect(prompt).toContain('Test backstory');
      expect(prompt).toContain('LANGUAGE SUPPORT:'); // Default support level
    });

    it('should apply different support levels correctly', () => {
      const config: NPCPromptConfig = {
        npc: mockNPC
      };

      // Test each support level
      const supportLevels = ['HEAVY_SUPPORT', 'MODERATE_SUPPORT', 'LIGHT_SUPPORT', 'IMMERSION'] as const;
      
      supportLevels.forEach(level => {
        const prompt = buildPrompt({ ...config, supportLevel: level });
        
        expect(prompt).toContain('LANGUAGE SUPPORT:');
        
        switch (level) {
          case 'HEAVY_SUPPORT':
            expect(prompt).toContain('Speak mostly Spanish with some English');
            expect(prompt).toContain('Use simple vocabulary and short sentences');
            break;
          case 'MODERATE_SUPPORT':
            expect(prompt).toContain('Speak primarily in Spanish');
            expect(prompt).toContain('Use intermediate vocabulary');
            break;
          case 'LIGHT_SUPPORT':
            expect(prompt).toContain('Speak almost entirely in Spanish');
            expect(prompt).toContain('Use natural vocabulary and expressions');
            break;
          case 'IMMERSION':
            expect(prompt).toContain('Speak only in Spanish, no English at all');
            expect(prompt).toContain('Act as if in a real Spanish-only environment');
            break;
        }
      });
    });

    it('should include learner adaptations when profile is provided', () => {
      const config: NPCPromptConfig = {
        npc: mockNPC,
        learnerProfile: {
          level: 'beginner',
          comfortWithSlang: false,
          needsMoreEnglish: true,
          strugglingWords: ['subjuntivo', 'condicional'],
          masteredPhrases: ['hola', 'por favor', 'gracias']
        }
      };

      const prompt = buildPrompt(config);

      expect(prompt).toContain('LEARNER ADAPTATIONS:');
      expect(prompt).toContain('The learner may need more English support than usual');
      expect(prompt).toContain('Avoid heavy slang, use more standard Spanish');
      expect(prompt).toContain('The learner struggles with: subjuntivo, condicional');
      expect(prompt).toContain('The learner has mastered: hola, por favor, gracias');
    });

    it('should not include learner adaptations section when profile is minimal', () => {
      const config: NPCPromptConfig = {
        npc: mockNPC,
        learnerProfile: {
          level: 'intermediate',
          comfortWithSlang: true,
          needsMoreEnglish: false,
          strugglingWords: [],
          masteredPhrases: []
        }
      };

      const prompt = buildPrompt(config);

      expect(prompt).not.toContain('LEARNER ADAPTATIONS:');
    });

    it('should handle NPC without optional fields gracefully', () => {
      const minimalNPC: NPC = {
        id: 'test',
        name: 'Test',
        role: 'Test Role',
        persona_prompt: 'Basic prompt',
        backstory: 'Basic backstory'
      };

      const config: NPCPromptConfig = {
        npc: minimalNPC
      };

      const prompt = buildPrompt(config);

      // Should not include sections for missing data
      expect(prompt).not.toContain('PERSONALITY:');
      expect(prompt).not.toContain('IMPORTANT QUIRKS');
      expect(prompt).not.toContain('KEY VOCABULARY TO USE:');
      expect(prompt).not.toContain('PRACTICAL INFORMATION:');
      expect(prompt).not.toContain('SAMPLE INTERACTIONS:');
    });
  });

  describe('addScenarioContext', () => {
    const basePrompt = 'You are a character. Follow these instructions.';

    it('should add context for known scenarios', () => {
      const scenarios = [
        { type: 'taco_vendor', expected: 'ordering tacos from your street stand' },
        { type: 'restaurant', expected: 'dining at your restaurant' },
        { type: 'hotel_checkin', expected: 'checking into your hotel' },
        { type: 'taxi_ride', expected: 'just got in your taxi' },
        { type: 'market', expected: 'shopping at your market stall' },
        { type: 'pharmacy', expected: 'needs help at your pharmacy' }
      ];

      scenarios.forEach(({ type, expected }) => {
        const result = addScenarioContext(basePrompt, type);
        expect(result).toContain(basePrompt);
        expect(result).toContain(expected);
      });
    });

    it('should return unchanged prompt for unknown scenarios', () => {
      const result = addScenarioContext(basePrompt, 'unknown_scenario');
      expect(result).toBe(basePrompt);
    });

    it('should handle empty scenario gracefully', () => {
      const result = addScenarioContext(basePrompt, '');
      expect(result).toBe(basePrompt);
    });
  });

  describe('Integration: buildPrompt with scenario context', () => {
    it('should create a complete prompt with scenario', () => {
      const config: NPCPromptConfig = {
        npc: {
          ...mockNPC,
          scenario_type: 'taco_vendor'
        },
        learnerProfile: {
          level: 'beginner',
          comfortWithSlang: false,
          needsMoreEnglish: true,
          strugglingWords: ['pedir', 'cuenta'],
          masteredPhrases: ['quiero', 'cuánto cuesta']
        },
        supportLevel: 'HEAVY_SUPPORT'
      };

      const prompt = buildPrompt(config);
      const promptWithScenario = addScenarioContext(prompt, 'taco_vendor');

      // Check complete integration
      expect(promptWithScenario).toContain('You are María');
      expect(promptWithScenario).toContain('Speak mostly Spanish with some English'); // Part of HEAVY_SUPPORT
      expect(promptWithScenario).toContain('The learner struggles with: pedir, cuenta');
      expect(promptWithScenario).toContain('ordering tacos from your street stand');
      expect(promptWithScenario).toContain('Never break character');
    });
  });
});