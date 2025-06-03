#!/usr/bin/env node

/**
 * Test script to verify adaptive learning functionality
 */

const { detectComprehension, generateAdaptivePrompt } = require('./src/lib/pedagogical-system');

console.log('=== Testing Adaptive Learning System ===\n');

// Test cases for comprehension detection
const testCases = [
  { input: "What did you say?", expected: "Needs help" },
  { input: "I don't understand", expected: "Needs help" },
  { input: "Sorry, can you repeat?", expected: "Needs help" },
  { input: "No entiendo", expected: "Needs help" },
  { input: "Hola, quiero dos tacos por favor", expected: "Spanish Focus" },
  { input: "Si, gracias, está bien", expected: "Spanish Focus" },
  { input: "How much? Cuánto cuesta?", expected: "Mixed - probably okay" },
  { input: "umm... uh...", expected: "Needs help" },
  { input: "???", expected: "Needs help" },
  { input: "Yes please, dos tacos de pastor", expected: "Spanish Focus" }
];

console.log('1. Testing Comprehension Detection:');
console.log('----------------------------------');

testCases.forEach(test => {
  const result = detectComprehension(test.input);
  const mode = (!result.understood && result.confidence < 0.3) ? 'Needs help' :
               (result.understood && result.confidence > 0.7) ? 'Spanish Focus' : 
               'No change';
  
  console.log(`\nInput: "${test.input}"`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Result: ${mode} (understood: ${result.understood}, confidence: ${result.confidence.toFixed(2)})`);
  console.log(`Indicators: ${result.indicators.join(', ')}`);
});

// Test adaptive prompt generation
console.log('\n\n2. Testing Adaptive Prompt Generation:');
console.log('--------------------------------------');

const profiles = [
  {
    name: "Beginner needs help",
    profile: {
      level: 'beginner',
      comfortWithSlang: false,
      needsMoreEnglish: true,
      strugglingWords: ['quiero', 'cuánto'],
      masteredPhrases: []
    }
  },
  {
    name: "Beginner doing well",
    profile: {
      level: 'beginner',
      comfortWithSlang: false,
      needsMoreEnglish: false,
      strugglingWords: [],
      masteredPhrases: ['hola', 'gracias', 'por favor']
    }
  },
  {
    name: "Intermediate needs help",
    profile: {
      level: 'intermediate',
      comfortWithSlang: true,
      needsMoreEnglish: true,
      strugglingWords: ['subjunctive', 'past_tense'],
      masteredPhrases: ['ordering', 'greetings', 'numbers']
    }
  }
];

profiles.forEach(({ name, profile }) => {
  console.log(`\n### ${name}:`);
  console.log(`Mode: ${profile.needsMoreEnglish ? 'Bilingual Helper' : 'Spanish Focus'}`);
  
  const prompt = generateAdaptivePrompt(
    'friendly taco vendor',
    'ordering_tacos',
    profile
  );
  
  // Extract key parts of the prompt
  const ratioMatch = prompt.match(/\((\d+\/\d+ ratio)\)/);
  const adaptiveSection = prompt.match(/ADAPTIVE TEACHING:([\s\S]+?)LEARNER-SPECIFIC/);
  
  console.log(`Language ratio: ${ratioMatch ? ratioMatch[1] : 'Not found'}`);
  if (adaptiveSection) {
    console.log('Adaptive teaching approach:', adaptiveSection[1].trim().split('\n')[1].trim());
  }
});

console.log('\n\n=== Summary ===');
console.log('The adaptive learning system should:');
console.log('1. Detect when users are confused (confidence < 0.3) and switch to Bilingual Helper mode');
console.log('2. Detect when users are doing well (confidence > 0.7) and switch to Spanish Focus mode');
console.log('3. Update AI instructions with different language ratios (60/40 vs 90/10)');
console.log('4. Save user adaptations to the database for persistence');
console.log('\nCheck the browser console when testing to see these logs in action!');