Voice Activity Detection (VAD) in Conversational AI

  Overview

  Voice Activity Detection (VAD) is the system that determines when someone is speaking versus when there's silence in a
  real-time conversation. It's the AI's "ears" that decide:
  - "Is the human talking right now?"
  - "Did they finish their thought?"
  - "Is it my turn to respond?"

  In human conversations, we use subtle cues like tone drops, natural pauses, and body language. VAD attempts to replicate this
  using only audio signals, making it crucial for natural-feeling AI conversations.

  The Three Core VAD Parameters

  1. Threshold (0.0 - 1.0)

  What it does: Sets the minimum audio level that counts as "speech" versus "silence/noise"

  The Challenge: Distinguishing actual speech from background noise
  - Coffee shop chatter
  - Computer fans
  - Traffic outside
  - Breathing sounds
  - Microphone static

  How it works:
  Audio Level Scale:
  0.0 |-----------|-----------|-----------|-----------|-----------|
      Silence    Breathing   Whisper    Normal     Shouting

  Threshold: 0.5 ────────────────┐
                                 ▼
  Everything below = "silence"   |   Everything above = "speech"

  Real-world impact:

  Too Low (0.2-0.3):
  Background: [coffee machine humming]
  VAD: "Someone's speaking!"
  AI: "I heard you say something, could you repeat that?"
  Human: "I didn't say anything..."

  Too High (0.8-0.9):
  Human: [speaking softly] "hola, como estas?"
  VAD: "Still silence..."
  Human: [louder] "HOLA, COMO ESTAS?"
  VAD: "Now they're speaking!"
  AI: "¡Hola! No need to shout!"

  Just Right (0.5-0.6):
  - Filters out ambient noise
  - Catches normal conversation levels
  - Works with most microphones
  - Allows for natural volume variations

  2. Silence Duration (milliseconds)

  What it does: How long to wait after speech stops before declaring "end of turn"

  The Challenge: Natural speech has pauses
  - Mid-sentence thinking ("The word is... um... biblioteca")
  - Breathing between long sentences
  - Dramatic effect ("Y entonces... apareció!")
  - Searching for vocabulary ("How do you say... tree?")

  How it works:
  Speech Timeline:
  "Hola, me llamo..." [300ms pause] "...Juan" [1500ms pause]
                      ↑                        ↑
                      Thinking pause           End of turn

  If silence_duration = 200ms: Cuts off after "llamo"
  If silence_duration = 1200ms: Waits for complete thought

  Real-world impact:

  Too Short (200-500ms):
  Teacher: "El subjuntivo se usa para..." [natural pause]
  VAD: "Turn ended!"
  Teacher: [gets cut off]
  Student: "¿Para qué?"
  Teacher: "Iba a decir, para expresar deseos"
  [Conversation becomes fragmented]

  Too Long (2000-3000ms):
  Student: "¿Cómo se dice 'book'?"
  [... awkward 3-second silence ...]
  Teacher: "Se dice 'libro'"
  Student: [already started looking it up because they thought AI was broken]

  Just Right (1000-1500ms):
  - Allows thinking pauses
  - Feels responsive
  - Natural conversation rhythm
  - No awkward silences

  3. Prefix Padding (milliseconds)

  What it does: Buffer time at the start of speech before "officially" beginning audio capture

  The Challenge: Speech doesn't start cleanly
  - "Umm... hello"
  - "Ah, sí, claro"
  - Clearing throat before speaking
  - False starts ("I wa-- I wanted to ask...")

  How it works:
  Actual speech: "...uh, hello, my name is Juan"
                  ↑─────500ms─────↑
                  Prefix padding   Official start

  Without padding: "llo, my name is Juan" (missed "uh, he-")
  With padding: "uh, hello, my name is Juan" (complete capture)

  Real-world impact:

  Too Short (100-200ms):
  Human: "Ehh... ¿cuánto cuesta?"
  AI hears: "cuánto cuesta?"
  [Misses hesitation, might misinterpret confidence level]

  Dynamic VAD: Adapting to Users and NPCs

  Part 1: User-Based VAD Profiles

  Different users need different VAD settings based on their circumstances and abilities. Here's how to think about user needs:

  User Environment Profiles

  🤫 Quiet Environment (Library, Home Office)
  {
    threshold: 0.4,        // Can detect softer speech
    silenceDurationMs: 800, // Quick natural turns
    prefixPaddingMs: 300    // Minimal padding needed
  }

  ☕ Moderate Noise (Café, Living Room)
  {
    threshold: 0.55,       // Filter background chatter
    silenceDurationMs: 1000, // Balanced patience
    prefixPaddingMs: 400    // Some buffer for noise
  }

  🚇 Noisy Environment (Public Transport, Street)
  {
    threshold: 0.7,        // Only clear speech
    silenceDurationMs: 1500, // Longer to avoid noise triggers
    prefixPaddingMs: 600    // More buffer for clarity
  }

  User Skill Level Profiles

  🌱 Beginner Spanish Learner
  {
    threshold: 0.5,        // Standard detection
    silenceDurationMs: 2000, // Lots of thinking time
    prefixPaddingMs: 700    // Catch "um" and false starts
  }
  // They need time to formulate sentences, find words

  🌿 Intermediate Learner
  {
    threshold: 0.5,
    silenceDurationMs: 1200, // Moderate thinking time
    prefixPaddingMs: 500
  }

  🌳 Advanced Speaker
  {
    threshold: 0.5,
    silenceDurationMs: 600,  // Quick, natural flow
    prefixPaddingMs: 300
  }

  User Personality/Needs

  💭 Thoughtful Speaker
  {
    silenceDurationMs: 2500, // "Let me think about that..."
    // Philosophers, careful speakers, overthinkers
  }

  ⚡ Quick Speaker
  {
    silenceDurationMs: 400,  // Rapid-fire conversation
    // Gamers, multitaskers, impatient users
  }

  ♿ Accessibility Needs
  {
    threshold: 0.3,         // Speech impediments
    silenceDurationMs: 3000, // Motor challenges
    prefixPaddingMs: 1000   // Extra accommodation
  }

  Part 2: NPC Personality-Based VAD Profiles

  VAD settings should reflect NPC personality and context. The settings shape how the NPC "listens" and creates their
  conversational style.

  NPC Archetypes

  👨‍🏫 The Patient Professor
  {
    threshold: 0.45,        // Listens carefully
    silenceDurationMs: 2000, // Gives students time to think
    prefixPaddingMs: 800    // Accepts "umm, profesor..."
  }
  // "Take your time, there's no rush to answer"

  🍜 The Soup Nazi (Impatient Vendor)
  {
    threshold: 0.6,        // Only clear orders
    silenceDurationMs: 300, // "NEXT!"
    prefixPaddingMs: 100   // No patience for hesitation
  }
  // "You stuttter? NO SOUP FOR YOU! NEXT!"

  🚕 The Chatty Taxi Driver
  {
    threshold: 0.5,
    silenceDurationMs: 400, // Jumps in quickly
    prefixPaddingMs: 200   // Always ready to talk
  }
  // Fills every silence with stories

  🎨 The Museum Guide
  {
    threshold: 0.5,
    silenceDurationMs: 1800, // Thoughtful pauses in explanations
    prefixPaddingMs: 600
  }
  // "This painting... *pause for effect* ...represents..."

  💊 The Precise Pharmacist
  {
    threshold: 0.55,       // Needs clarity for safety
    silenceDurationMs: 1500, // Ensures complete information
    prefixPaddingMs: 500
  }
  // Must hear complete symptoms before responding

  Contextual NPC Settings

  Rush Hour Scenarios
  // Taco stand at lunch rush
  const rushHourVAD = {
    threshold: 0.65,       // Noisy environment
    silenceDurationMs: 400, // Keep line moving
    prefixPaddingMs: 200   // Quick service
  }

  // Same taco stand at 3pm
  const slowTimeVAD = {
    threshold: 0.5,
    silenceDurationMs: 1200, // Can chat more
    prefixPaddingMs: 500
  }

  Part 3: Combining User + NPC Settings

  The key insight: adjust from both ends to create natural conversation flow.

  The VAD Negotiation Matrix

                      Patient NPC    Balanced NPC    Impatient NPC
  Beginner User         2000ms         1500ms          1000ms*
  Intermediate          1500ms         1000ms           600ms
  Advanced              1000ms          700ms           400ms

  * Even impatient NPCs should accommodate beginners

  Implementation Pattern

  function calculateOptimalVAD(userProfile, npcProfile, context) {
    // Start with NPC baseline
    let vad = { ...npcProfile.vadSettings };

    // Adjust for user needs
    if (userProfile.level === 'beginner') {
      vad.silenceDurationMs = Math.max(vad.silenceDurationMs, 1000);
      vad.prefixPaddingMs = Math.max(vad.prefixPaddingMs, 500);
    }

    // Environment adjustments
    if (userProfile.environment === 'noisy') {
      vad.threshold = Math.min(vad.threshold + 0.2, 0.8);
    }

    // Context overrides
    if (context.isRushHour && npcProfile.type === 'vendor') {
      vad.silenceDurationMs = Math.min(vad.silenceDurationMs, 600);
    }

    return vad;
  }

  Part 4: Dynamic Personality Through VAD

  VAD can convey personality without changing a single word:

  The Interrupting Friend
  {
    silenceDurationMs: 200,  // Can't wait to talk
    personality: "¡Ay, sí, sí! Yo también..."
  }

  The Thoughtful Therapist
  {
    silenceDurationMs: 3000,  // "Mmm... tell me more..."
    personality: "Contemplative, never rushes"
  }

  The Nervous Student
  {
    threshold: 0.4,          // Speaks softly
    prefixPaddingMs: 1000,   // Lots of "ums"
    personality: "Uncertain, needs encouragement"
  }

  Part 5: Testing and Tuning Guide

  Quick Test Phrases

  Test your VAD settings with these patterns:

  For Silence Duration:
  - "El libro está... en la mesa" (natural pause)
  - "¿Cómo se dice... how do you say... tree?" (thinking pause)
  - "Uno... dos... tres" (counting pause)

  For Threshold:
  - Whisper: "hola"
  - Normal: "Hola"
  - Loud: "¡HOLA!"

  For Prefix Padding:
  - "Umm... quiero un café"
  - "Ah, este, bueno... sí"
  - "[cough] Disculpe..."

  Debug Settings

  const DEBUG_VAD = {
    onSpeechStart: () => console.log('🎤 Speech detected'),
    onSpeechEnd: () => console.log('🔇 Silence detected'),
    onTurnEnd: () => console.log('🏁 Turn ended'),
    showThresholdMeter: true  // Visual audio level
  }

  Part 6: Common Pitfalls and Solutions

  Pitfall: One-size-fits-all VAD
  Solution: Profile system with easy switching

  Pitfall: Not considering NPC context
  Solution: Time-of-day and situation awareness

  Pitfall: Forgetting about network latency
  Solution: Add 200ms buffer in poor connections

  Pitfall: Binary thinking (patient vs impatient)
  Solution: Graduated scale with situational overrides

  Recommended Implementation

  // In your NPC config
  export const TRAVEL_AGENT_PATRICIA = {
    name: 'Lic. Patricia',
    vadProfiles: {
      default: {
        threshold: 0.5,
        silenceDurationMs: 1200,
        prefixPaddingMs: 500
      },
      busy: {
        threshold: 0.6,
        silenceDurationMs: 800,
        prefixPaddingMs: 300
      },
      relaxed: {
        threshold: 0.45,
        silenceDurationMs: 1800,
        prefixPaddingMs: 700
      }
    }
  }

  // In your app
  const getCurrentVAD = (npc, userProfile, timeOfDay) => {
    const npcProfile = timeOfDay === 'rush' ? npc.vadProfiles.busy : npc.vadProfiles.default;
    return calculateOptimalVAD(userProfile, npcProfile);
  }

  This approach gives you flexible, personality-driven conversations that adapt to both user needs and NPC character while
  maintaining natural flow.

