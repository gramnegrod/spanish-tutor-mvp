

⏺ Spanish Tutor Adaptive Learning System - Comprehension Detection

  Overview

  The comprehension detection system is the brain of our adaptive Spanish learning app. It analyzes what users say (transcribed by Whisper) to
  determine if they're understanding or struggling, which then drives how the AI tutor adapts its language mix.

  The Core Challenge

  How do we programmatically determine if someone understands Spanish from a voice transcript?

  Our system needs to classify user speech into a spectrum from "completely lost" to "confidently speaking Spanish" - and everything in between.

  System Architecture

  User speaks → Whisper transcribes → detectComprehension() analyzes →
  → Consecutive tracking (2 confirmations) → AI mode switching → Behavior changes

  The Detection Algorithm

  1. Weighted Signal Recognition

  We identify and score different types of signals in the user's speech:

  Confusion Signals (Negative Points)

  // Strong confusion (3 points) - Explicit statements
  'i don\'t understand': 3
  'no entiendo': 3
  'what does that mean': 3
  'qué significa': 3

  // Medium confusion (2 points) - Likely confused
  'what': 2
  'sorry': 2
  'can you repeat': 2
  'más despacio': 2

  // Weak confusion (1 point) - Mild hesitation
  'umm': 1
  'uh': 1
  'er': 1

  Understanding Signals (Positive Points)

  // Strong Spanish usage (3 points) - Complex phrases
  'quiero tacos': 3
  'me da': 3
  'por favor': 3
  'cuánto cuesta': 3

  // Good Spanish (2 points) - Common words used correctly
  'hola': 2
  'gracias': 2
  'tacos': 2
  'pastor': 2

  // Basic understanding (1 point) - Simple acknowledgments
  'okay': 1
  'yes': 1
  'sí': 1

  2. Word Boundary Matching

  To avoid false positives, we use regex word boundaries:

  const matchWholeWord = (text: string, word: string): boolean => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  };

  This ensures:
  - ✓ "what" matches in: "what is that?"
  - ✗ "what" doesn't match in: "whatever you want"

  3. Context Bonuses

  We award bonus points for engagement indicators:

  // Length bonus - Longer responses show more engagement
  const lengthBonus = wordCount > 5 ? 2 : (wordCount > 3 ? 1 : 0);

  // Spanish pronunciation detected by Whisper
  const hasSpanishChars = /[ñáéíóú]/i.test(input) ? 1 : 0;

  // Question engagement - Asking questions shows active learning
  const isQuestion = /[?¿]/.test(input) && understandingScore > 0 ? 1 : 0;

  Note on Spanish Characters: When Whisper transcribes "niño" instead of "nino", it detected proper Spanish pronunciation. These accent marks
  and special characters indicate the user is attempting authentic Spanish sounds.

  4. Smart Thresholding

  Understanding requires significantly more positive signals than negative:

  // Must have 1.5x more understanding than confusion
  const understood = totalUnderstanding > totalConfusion * 1.5;

  5. Confidence Calculation

  We calculate a nuanced confidence score (0-1) rather than binary yes/no:

  const rawConfidence = (totalUnderstanding - totalConfusion) / (totalUnderstanding + totalConfusion + 1);
  const confidence = Math.min(1, Math.max(0, (rawConfidence + 1) / 2));

  Real-World Examples

  Example 1: Confused User

  Speech: "Wait, no entiendo... what?"
  - Confusion: "no entiendo" (3) + "what" (2) = 5 points
  - Understanding: 0 points
  - Result: Not understood (confidence: 0.1)
  - AI Response: Switches to heavy English support

  Example 2: Confident Spanish Speaker

  Speech: "Sí, quiero tres tacos de carnitas por favor"
  - Confusion: 0 points
  - Understanding: "sí" (2) + "quiero" (3) + "tacos" (2) + "carnitas" (2) + "por favor" (3) = 12 points
  - Bonuses: Spanish accent detected (1) + length > 5 words (2) = 3 points
  - Result: Understood! (confidence: 0.9)
  - AI Response: Continues in Spanish immersion mode

  Example 3: Engaged Learner Asking Questions

  Speech: "Umm... ¿cómo se dice beef?"
  - Confusion: "umm" (1) = 1 point
  - Understanding: "cómo" (1) = 1 point
  - Bonuses: Question mark (1) + Spanish chars (1) = 2 points
  - Result: Partially understood (confidence: 0.5)
  - AI Response: Answers the question with bilingual support

  Database Examples After 5 Sessions

  🔴 Struggling Student Profile

  {
    "user_id": "user_123",
    "learner_profile": {
      "level": "beginner",
      "needsMoreEnglish": true,
      "averageConfidence": 0.25,
      "pronunciation": "poor",
      "fluency": "halting",
      "masteredPhrases": [
        "hola",
        "tacos",
        "yes",
        "okay",
        "gracias"
      ],
      "strugglingWords": [
        "no entiendo",
        "what",
        "sorry",
        "repeat",
        "i don't understand",
        "can you repeat",
        "slower"
      ]
    },
    "session_stats": {
      "total_sessions": 5,
      "average_confidence_per_session": [0.2, 0.18, 0.25, 0.3, 0.28],
      "mode_switches": 8,
      "time_in_helper_mode": "94%",
      "time_in_spanish_mode": "6%"
    },
    "recent_transcripts": [
      {
        "session": 5,
        "user": "umm... hello? I want... uh... tacos?",
        "confidence": 0.3,
        "mode": "bilingual_helper"
      },
      {
        "session": 5,
        "user": "what? no entiendo",
        "confidence": 0.1,
        "mode": "bilingual_helper"
      }
    ]
  }

  🟡 Average Student Profile

  {
    "user_id": "user_456",
    "learner_profile": {
      "level": "beginner",
      "needsMoreEnglish": false,
      "averageConfidence": 0.55,
      "pronunciation": "fair",
      "fluency": "developing",
      "masteredPhrases": [
        "hola",
        "buenos días",
        "gracias",
        "por favor",
        "quiero",
        "tacos",
        "cuánto cuesta",
        "está bien",
        "dos",
        "tres",
        "con todo"
      ],
      "strugglingWords": [
        "umm",
        "repeat",
        "más despacio"
      ]
    },
    "session_stats": {
      "total_sessions": 5,
      "average_confidence_per_session": [0.35, 0.45, 0.5, 0.6, 0.65],
      "mode_switches": 12,
      "time_in_helper_mode": "45%",
      "time_in_spanish_mode": "55%"
    },
    "recent_transcripts": [
      {
        "session": 5,
        "user": "Hola, buenos días... quiero dos tacos por favor",
        "confidence": 0.7,
        "mode": "spanish_focus"
      },
      {
        "session": 5,
        "user": "umm... ¿cuánto cuesta?",
        "confidence": 0.5,
        "mode": "spanish_focus"
      }
    ]
  }

  🟢 Above Average Student Profile

  {
    "user_id": "user_789",
    "learner_profile": {
      "level": "intermediate",
      "needsMoreEnglish": false,
      "averageConfidence": 0.82,
      "pronunciation": "good",
      "fluency": "conversational",
      "masteredPhrases": [
        "buenos días",
        "buenas tardes",
        "¿qué tal?",
        "quiero",
        "me da",
        "quisiera",
        "por favor",
        "muchas gracias",
        "disculpe",
        "con permiso",
        "cuánto cuesta",
        "cuánto es",
        "está bien",
        "perfecto",
        "con todo",
        "sin cebolla",
        "para llevar",
        "aquí",
        "órale",
        "tacos de pastor",
        "carnitas",
        "salsa verde",
        "picante",
        "no tan picante"
      ],
      "strugglingWords": []
    },
    "session_stats": {
      "total_sessions": 5,
      "average_confidence_per_session": [0.65, 0.75, 0.8, 0.85, 0.9],
      "mode_switches": 3,
      "time_in_helper_mode": "8%",
      "time_in_spanish_mode": "92%"
    },
    "recent_transcripts": [
      {
        "session": 5,
        "user": "¡Buenos días! Me da cuatro tacos de pastor con todo, y dos de carnitas sin cebolla por favor",
        "confidence": 0.95,
        "mode": "spanish_focus"
      },
      {
        "session": 5,
        "user": "¿Tiene salsa verde? No muy picante, por favor",
        "confidence": 0.88,
        "mode": "spanish_focus"
      }
    ]
  }

  How Confidence Affects the Prompt

  The confidence score indirectly changes the prompt through the consecutive tracking system:

  // The confidence score variable in the code:
  const { understood, confidence, indicators } = detectComprehension(text);

  // It triggers consecutive tracking:
  if (confidence < 0.3) {
    consecutiveFailures++;
    // After 2 failures → Switch to Bilingual Helper Mode
  }
  if (confidence > 0.7) {
    consecutiveSuccesses++;
    // After 2 successes → Switch to Spanish Focus Mode
  }

  The Prompt Changes Based on Mode, Not Individual Scores

  The system has two distinct prompts that it switches between:

  1. Bilingual Helper Mode Prompt (needsMoreEnglish = true)

  const bilingualHelperPrompt = `
  🎯 BILINGUAL HELPER MODE - USER IS STRUGGLING, BE EXTREMELY HELPFUL!

  You are a friendly Mexican taco vendor (taquero) Don Roberto in Mexico City. 
  Speak 70% ENGLISH, 30% SPANISH to help the struggling learner.

  ❗ CRITICAL LANGUAGE RULES:
  - Lead with English, then add Spanish: "Hello! ¡Hola! What can I get you?"
  - Translate everything: "Tacos - that's like a sandwich but with tortilla"
  - Go slow and be patient: "No problem, take your time!"
  - Confirm understanding constantly: "Understand? ¿Entiendes? Good!"

  MENU EXPLANATIONS (Always in English first):
  - "Al pastor is pork with pineapple - cerdo con piña, very popular!"
  - "Carnitas means little meats - crispy pork, so good!"

  BE A HELPFUL TOURIST GUIDE, NOT A LANGUAGE TEACHER!
  `;

  2. Spanish Focus Mode Prompt (needsMoreEnglish = false)

  const spanishFocusPrompt = `
  🇲🇽 SPANISH FOCUS MODE - USER IS DOING WELL, IMMERSION TIME!

  Eres un taquero mexicano Don Roberto. Hablas 90% ESPAÑOL, 10% inglés.

  ❗ REGLAS DE IDIOMA:
  - Habla principalmente en español
  - Solo usa inglés para palabras muy técnicas
  - Usa expresiones mexicanas: "¡Órale!", "¡Ándale!", "¿Mande?"
  - Habla natural y rápido como mexicano real

  ESTILO:
  - "¡Buenos días joven! ¿Qué le doy hoy?"
  - "Tenemos unos tacos de pastor bien ricos"
  - "¿Con todo? ¿Salsa verde o roja?"

  SÉ UN VERDADERO MEXICANO, NO UN MAESTRO!
  `;

  When Does the Prompt Update?

  The prompt ONLY updates when mode switches, not with every response:

  // In practice-no-auth/page.tsx:
  if (newFailures >= REQUIRED_CONFIRMATIONS && !learnerProfile.needsMoreEnglish) {
    // Mode switch triggered!
    const newProfile = { ...learnerProfile, needsMoreEnglish: true };
    updateAIInstructions(newProfile); // ← This sends new prompt to OpenAI
  }

  The updateAIInstructions Function

  const updateAIInstructions = (profile: LearnerProfile) => {
    const adaptivePrompt = generateAdaptivePrompt(
      'friendly Mexican taco vendor (taquero) Don Roberto',
      currentScenario,
      profile // ← This contains needsMoreEnglish boolean
    );

    if (updateInstructions) {
      updateInstructions(adaptivePrompt); // ← Sends to OpenAI Realtime API
    }
  };

  Important: The Confidence Score is NOT in the Prompt

  The LLM never sees the confidence score directly. Instead:

  1. Confidence < 0.3 (twice) → System switches to Helper Mode → LLM gets bilingual prompt
  2. Confidence > 0.7 (twice) → System switches to Spanish Mode → LLM gets immersion prompt

  Example Flow

  // User says: "I don't understand"
  confidence = 0.1 // Very low

  // First time: No prompt change, just increment counter
  consecutiveFailures = 1

  // User says again: "What? No entiendo"
  confidence = 0.15 // Still very low

  // Second time: Trigger mode switch!
  consecutiveFailures = 2
  // NOW the prompt changes to Bilingual Helper Mode

  // OpenAI receives this new instruction:
  session.update({
    instructions: bilingualHelperPrompt // The full helper prompt above
  })

  Key Points

  1. The prompt changes based on MODE, not individual confidence scores
  2. Mode switches require 2 consecutive high/low confidence responses
  3. The LLM never sees numbers like "confidence: 0.3"
  4. The prompt is relatively stable - it only changes when crossing mode thresholds
  5. This prevents "prompt thrashing" where the AI personality would constantly change

  Why This Design?

  - Stability: The AI maintains consistent behavior until clear pattern emerges
  - Natural feel: Like a real tutor who adjusts teaching style, not every sentence
  - Efficiency: We're not sending new prompts with every single response
  - Clear modes: Users experience distinct "helper" vs "immersion" experiences

  The confidence score is the input to our system, but the output to the LLM is a carefully crafted persona prompt that creates the right
  learning environment!

