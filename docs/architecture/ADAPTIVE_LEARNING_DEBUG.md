# Adaptive Learning Debug Summary

## Current Implementation

The adaptive learning system is properly connected between all components:

### 1. **Comprehension Detection** (`src/lib/pedagogical-system.ts`)
- `detectComprehension()` analyzes user input for confusion indicators
- Returns `understood` boolean and `confidence` score (0-1)
- Triggers mode change when:
  - **Needs help**: `!understood && confidence < 0.3`
  - **Doing well**: `understood && confidence > 0.7`

### 2. **Profile Updates** (`src/app/practice/page.tsx`)
- When comprehension is detected, the learner profile is updated
- `needsMoreEnglish` flag controls the mode:
  - `true` = Bilingual Helper mode (60/40 Spanish/English)
  - `false` = Spanish Focus mode (90/10 Spanish/English)

### 3. **AI Instruction Updates**
- `updateAIInstructions()` generates new prompts using `generateAdaptivePrompt()`
- Calls `updateInstructions()` from the OpenAI service
- Service sends `session.update` message to OpenAI with new instructions

### 4. **What Changes Between Modes**

#### Spanish Focus Mode (90/10 ratio):
```
- Use mostly Spanish with minimal English (90/10 ratio)
- IMPORTANT: User is doing well, use MOSTLY Spanish with minimal English
```

#### Bilingual Helper Mode (60/40 ratio):
```
- Mix Spanish with supportive English (60/40 ratio)
- IMPORTANT: Since user needs help, use MORE English to support understanding
```

## Debugging Steps

### 1. Check Browser Console
Look for these log messages:

```javascript
// When user seems confused:
[Practice] User needs help - switching to Bilingual Helper mode
[Practice] Comprehension analysis: {understood: false, confidence: 0.2, indicators: [...]}
[Practice] updateAIInstructions called with profile: {needsMoreEnglish: true, ...}
[Practice] Sending updated instructions to OpenAI. Profile state: {mode: 'Bilingual Helper'}
[OpenAIRealtimeService] updateInstructions called
[OpenAIRealtimeService] Sending session.update with instructions preview: ...

// When user is doing well:
[Practice] User doing well - switching to Spanish Focus mode
[Practice] Comprehension analysis: {understood: true, confidence: 0.8, indicators: [...]}
[Practice] updateAIInstructions called with profile: {needsMoreEnglish: false, ...}
[Practice] Sending updated instructions to OpenAI. Profile state: {mode: 'Spanish Focus'}
```

### 2. Test Phrases

To trigger **Bilingual Helper** mode, say:
- "What did you say?"
- "I don't understand"
- "Sorry, can you repeat?"
- "No entiendo"
- "???"

To trigger **Spanish Focus** mode, say:
- "Hola, quiero dos tacos por favor"
- "Sí, gracias"
- "Está bien"
- "Cuánto cuesta?"

### 3. Verify AI Behavior Change

After mode switch, the AI should:

**In Bilingual Helper mode:**
- Use more English explanations
- Code-switch frequently
- Example: "¿Qué quieres? What do you want? Los tacos are really good!"

**In Spanish Focus mode:**
- Use mostly Spanish
- Minimal English support
- Example: "¡Órale! ¿Cuántos tacos quieres? Tengo pastor, carnitas..."

## Potential Issues

1. **Instructions not updating**: Check if data channel is open when `updateInstructions` is called
2. **Mode not switching**: Verify comprehension thresholds (0.3 and 0.7)
3. **AI not changing behavior**: OpenAI models can be inconsistent - the instructions are sent correctly but the model may not always follow them perfectly

## Testing the System

Run the test script to verify comprehension detection:
```bash
node test-adaptive-learning.js
```

This will show how different inputs are classified and what prompts are generated for different learner profiles.