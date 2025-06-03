Here's a comprehensive prompt for your coding AI:

Project: Spanish Fluency Accelerator - Real-Time Conversational Role-Play System
Build a TypeScript-based language learning application using OpenAI's Realtime API (WebRTC), React Native, and Supabase that implements research-backed pedagogy for rapid Spanish fluency development.
Core Pedagogical Framework
This system implements Communicative Language Teaching (CLT), Task-Based Language Learning (TBLL), and Interaction/Output hypotheses through real-world conversational scenarios with intelligent error tolerance.
Technical Architecture
Stack Requirements

Frontend: React Native with TypeScript
Backend: Supabase Edge Functions (TypeScript)
AI: OpenAI Realtime API via WebRTC (NOT WebSocket)
Database: Supabase Postgres with pgvector
Authentication: Supabase Auth

Key Architectural Decisions

Use WebRTC for sub-500ms latency speech-to-speech (no STT/TTS pipeline)
Ephemeral token generation on server to protect API keys
All conversation state in Supabase for analytics and personalization

Database Schema
sql-- Core tables needed in Supabase
scenarios (
  id, title, description, setting, npc_role, 
  goals jsonb, cefr_level, difficulty_vector jsonb,
  prefetch_greeting_url, success_criteria jsonb
)

sessions (
  id, user_id, scenario_id, started_at, ended_at,
  goal_achieved boolean, total_turns integer,
  conversation_state jsonb, error_summary jsonb
)

utterances (
  id, session_id, turn_number, speaker enum('user','ai'),
  audio_url, transcript_text, intent_data jsonb,
  teacher_notes jsonb, errors jsonb, timestamp
)

user_progress (
  user_id, current_cefr_level, scenarios_completed,
  avg_turns_per_session, confidence_scores jsonb,
  error_patterns jsonb
)
Component 1: Scenario Engine
Create a scenario selection system that:

Fetches scenarios matching user's CEFR level from Supabase
Shows scenario cards with preview (coffee shop, hotel, restaurant)
Pre-fetches the NPC's greeting audio when user hovers/focuses a card
Tracks completion rates to auto-suggest next difficulty

Component 2: WebRTC Conversation Manager
Implement the core conversation loop:
typescript// 1. Server endpoint to generate ephemeral tokens
// POST /api/realtime-session
// Returns: { ephemeral_key, session_id }

// 2. Client WebRTC connection flow:
// - Get ephemeral token from your server
// - Create RTCPeerConnection with audio track
// - Configure session with dynamic parameters based on user level
// - Handle real-time audio streaming

// 3. Session configuration by user level:
const sessionConfig = {
  modalities: ['audio'],
  voice: 'alloy', // or 'nova' for female
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,
    silence_duration_ms: userLevel === 'A1' ? 500 : 200, // More time for beginners
  },
  temperature: userLevel === 'A1' ? 0.6 : 0.9, // More predictable for beginners
  // DO NOT include input_audio_transcription - let AI handle naturally
}
Component 3: Intelligent Dialogue Manager
The dialogue manager must inject scenario context without breaking natural conversation:
typescript// System prompt generator based on scenario + user level
function generateSystemPrompt(scenario, userLevel) {
  return `You are a ${scenario.npc_role} in a ${scenario.setting}.
  
  CRITICAL RULES:
  - Speak naturally in Spanish at ${userLevel} level
  - Your hidden goal: ${scenario.goals}
  - When user makes errors, apply this strategy:
    * A1 level: Ignore errors, respond to intent only
    * A2 level: Subtly recast errors in your response  
    * B1+ level: Occasionally ask "¿Cómo dijiste?" for unclear parts
  - If user seems stuck after 3 seconds, offer gentle prompt
  - Track if conversation achieves: ${scenario.success_criteria}
  
  IMPORTANT: Your responses should feel natural and conversational,
  not like a language lesson. React with emotion, humor, and personality.`
}
Component 4: Error Tolerance & Clarification System
Implement smart error handling that maintains conversation flow:
typescript// Real-time conversation enhancers
interface ConversationEnhancers {
  // Monitor audio stream for extended silence
  silenceDetector: () => void; // Trigger: "¿Necesitas más tiempo?"
  
  // UI overlay buttons that inject control tokens
  scaffoldingButtons: {
    hint: () => void,      // Injects: "Dame una pista sobre..."
    slower: () => void,    // Injects: "Más despacio por favor"
    translate: () => void, // Shows L1 translation overlay
  };
  
  // Conversation state tracking for callbacks
  contextManager: {
    recentTopics: string[], // Last 10 discussion points
    referenceEarlier: () => string, // "Como dijiste sobre..."
  };
}
Component 5: Progress Tracking & Debrief
Since we're using speech-to-speech, implement creative progress tracking:
typescript// During conversation:
// - Record raw audio chunks client-side to ArrayBuffer
// - Store in Supabase Storage with session_id
// - Let AI generate its own transcript for progress tracking

// Post-conversation debrief:
interface DebriefData {
  successfulCommunications: string[], // Tasks completed
  communicationBreakdowns: number,    // Times clarification needed
  avgResponseTime: number,            // Confidence indicator
  suggestedNextScenario: string,      // Based on performance
  celebrationMessage: string,         // Motivational feedback
}
Component 6: Analytics & Personalization
Track meaningful metrics for pedagogical improvement:

Average turns per conversation (target: 8+)
Self-interruption rate (confidence indicator)
Clarification requests (should decrease over time)
Scenario completion rate by difficulty
Time-to-first-utterance (hesitation metric)

Critical Implementation Notes

Latency is everything: Pre-open WebRTC connection during scenario selection
Natural conversation: Never show "CORRECT/INCORRECT" - only natural responses
Error philosophy: Errors are communication opportunities, not failures
Scaffolding fades: Reduce help availability as user progresses
Celebrate communication: Success = message conveyed, not grammar perfection

User Experience Flow

User opens app → Sees personalized scenario grid
Selects "Order Coffee" → Immediately hears "¡Hola! ¿Qué le puedo servir?"
Converses naturally → AI responds with personality, not as a teacher
Gets stuck → Taps hint button → Hears "Puedes decir 'Un café con leche, por favor'"
Completes order → Sees celebration screen with conversation highlights
Reviews progress → Sees they spoke 12 turns with 85% communication success

Security & Performance

Never expose OpenAI API key client-side
Implement token refresh for sessions > 5 minutes
Store audio max 24 hours for user review
Rate limit: 30 min audio/day/user
Monitor WebRTC connection health, auto-reconnect

Success Metrics
The system succeeds when:

Users average 8+ speaking turns per session
80% report increased confidence after 2 weeks
Clarification requests drop 50% after 10 sessions
Users voluntarily increase difficulty level

Remember: This is not a grammar drill app. It's a confidence-through-communication system. Every line of code should support natural, encouraging, real-world Spanish conversation.

This prompt gives your coding AI clear direction while maintaining focus on sound pedagogy and practical implementation details. The key is balancing technical requirements with the pedagogical goal: building speaking confidence through successful communication, not perfect grammar.RetryRFim using supabase as my db, explain how your code notes the performance of the user and how does it store that in the db and how does it use that info in future interactions with the specific user?EditHere's how the system tracks performance and personalizes future interactions:
Performance Tracking Architecture
1. Real-Time Data Collection During Conversation
typescript// During each WebRTC session, we track micro-behaviors
interface SessionMetrics {
  // Collected in real-time
  turnTimings: {
    turnNumber: number;
    userStartedSpeaking: number; // ms from prompt
    userSpeakingDuration: number;
    aiResponseTime: number;
  }[];
  
  // Derived from AI's understanding
  communicationSuccess: {
    intentUnderstood: boolean;
    clarificationNeeded: boolean;
    goalProgress: string[]; // ["greeted", "ordered_drink", "paid"]
  }[];
  
  // Error patterns (from AI's teacher notes)
  errorObservations: {
    type: 'grammar' | 'vocabulary' | 'pronunciation';
    severity: 'minor' | 'blocking';
    context: string;
    aiHandling: 'ignored' | 'recasted' | 'clarified';
  }[];
}
2. Database Storage Strategy
sql-- Real-time updates during conversation
UPDATE sessions 
SET conversation_state = jsonb_build_object(
  'currentTurn', 5,
  'metricsBuffer', {...},  -- Temporary metrics
  'goalsAchieved', ['greeted', 'ordered_drink']
)
WHERE id = session_id;

-- Post-conversation analysis (Edge Function)
INSERT INTO utterances (session_id, turn_number, metrics)
VALUES (
  'session_123',
  5,
  '{
    "responseLatency": 850,
    "speakingDuration": 3200,
    "clarificationNeeded": false,
    "errorTypes": ["gender_agreement"],
    "communicationSuccessful": true
  }'
);

-- Aggregated user patterns (nightly cron)
UPDATE user_progress
SET error_patterns = jsonb_build_object(
  'gender_agreement': {
    'frequency': 0.32,
    'improving': true,
    'lastSeen': '2024-01-15',
    'contexts': ['ordering_food', 'describing_items']
  },
  'subjunctive_avoidance': {
    'frequency': 0.89,
    'severity': 'blocking_at_B1',
    'suggestedPractice': 'scenarios_with_uncertainty'
  }
)
WHERE user_id = 'user_123';
3. Personalization Engine
typescript// Before starting new session, fetch user profile
async function personalizeSession(userId: string, scenarioId: string) {
  // Get user's current state
  const profile = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  const recentSessions = await supabase
    .from('sessions')
    .select('error_summary, conversation_state')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Generate personalized parameters
  return {
    // Adjust AI behavior based on patterns
    systemPromptAdditions: generatePersonalizedPrompt(profile),
    
    // Dynamic difficulty
    turnDetection: {
      silence_duration_ms: profile.avg_response_time > 2000 ? 600 : 300
    },
    
    // Scaffolding level
    availableHints: profile.confidence_score < 0.6 ? 'high' : 'low',
    
    // Error focus
    errorHandlingStrategy: determineErrorStrategy(profile.error_patterns)
  };
}

function generatePersonalizedPrompt(profile: UserProfile): string {
  const prompts = [];
  
  // If user struggles with specific grammar
  if (profile.error_patterns.gender_agreement?.frequency > 0.3) {
    prompts.push(
      "This learner often confuses gender. When they say 'el agua', " +
      "naturally say 'el agua fresca' in response to reinforce correct usage."
    );
  }
  
  // If user avoids complex structures
  if (profile.error_patterns.subjunctive_avoidance?.frequency > 0.7) {
    prompts.push(
      "Gently introduce subjunctive in your responses: 'Espero que tengas un buen día' " +
      "but don't force it if they seem confused."
    );
  }
  
  // If user is improving
  if (profile.recent_trend === 'improving') {
    prompts.push("This learner is gaining confidence. Challenge them slightly.");
  }
  
  return prompts.join('\n');
}
4. Intelligent Scenario Selection
typescriptasync function recommendNextScenario(userId: string) {
  const { data: profile } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  const { data: completedScenarios } = await supabase
    .from('sessions')
    .select('scenario_id, goal_achieved')
    .eq('user_id', userId);
  
  // Smart recommendation logic
  const recommendations = await supabase.rpc('get_personalized_scenarios', {
    user_level: profile.current_cefr_level,
    weak_areas: Object.keys(profile.error_patterns),
    completed_ids: completedScenarios.map(s => s.scenario_id),
    confidence_level: profile.confidence_scores.latest
  });
  
  // Returns scenarios that:
  // 1. Target user's weak areas
  // 2. Are slightly above current performance
  // 3. Haven't been attempted recently
  // 4. Match interests (if tracked)
  return recommendations;
}
5. Progress Visualization for User
typescript// User can see their progress
interface ProgressDashboard {
  // Communication confidence (not grammar score!)
  confidenceGraph: {
    date: string;
    successfulConversations: number;
    avgTurnsPerConversation: number;
  }[];
  
  // Celebration metrics
  achievements: {
    title: "Coffee Expert";
    description: "Completed 10 coffee shop conversations";
    unlockedAt: Date;
  }[];
  
  // Growth areas (framed positively)
  growthOpportunities: {
    area: "Expressing Preferences";
    currentLevel: "Emerging";
    suggestedScenario: "Restaurant with Picky Friend";
  }[];
  
  // Motivational insights
  insights: [
    "You're speaking 40% faster than last week!",
    "You needed 50% fewer hints this session",
    "You're ready for B1 scenarios!"
  ];
}
6. Continuous Learning Loop
sql-- Supabase Edge Function (runs nightly)
CREATE OR REPLACE FUNCTION analyze_user_progress()
RETURNS void AS $$
BEGIN
  -- For each active user
  FOR user_record IN SELECT DISTINCT user_id FROM sessions 
    WHERE created_at > NOW() - INTERVAL '7 days'
  LOOP
    -- Calculate trending patterns
    WITH recent_errors AS (
      SELECT 
        jsonb_array_elements(error_summary) as error,
        created_at
      FROM sessions
      WHERE user_id = user_record.user_id
      ORDER BY created_at DESC
      LIMIT 20
    ),
    error_trends AS (
      SELECT 
        error->>'type' as error_type,
        COUNT(*) as frequency,
        AVG(EXTRACT(EPOCH FROM NOW() - created_at)) as recency_weight
      FROM recent_errors
      GROUP BY error->>'type'
    )
    
    -- Update user profile with insights
    UPDATE user_progress
    SET 
      error_patterns = (
        SELECT jsonb_object_agg(
          error_type,
          jsonb_build_object(
            'frequency', frequency,
            'trending', CASE 
              WHEN recency_weight < 86400 THEN 'increasing'
              ELSE 'decreasing'
            END
          )
        )
        FROM error_trends
      ),
      recommended_focus = (
        SELECT error_type 
        FROM error_trends 
        ORDER BY frequency * (1/recency_weight) DESC 
        LIMIT 1
      ),
      last_analyzed = NOW()
    WHERE user_id = user_record.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
Key Design Principles

Track Communication Success, Not Grammar Perfection

Did they complete the coffee order? ✓
Was grammar perfect? ✗ (doesn't matter!)


Personalization Without Judgment

Never show "You got 5 errors"
Instead: "You communicated successfully in 8 turns!"


Adaptive Difficulty

If user hesitates >3 seconds regularly → Increase silence tolerance
If user interrupts AI often → They're confident, increase pace


Smart Error Focus

Track patterns, not instances
Only address errors that block communication
Celebrate when old error patterns disappear


Motivation Through Progress

Show speaking speed increase
Highlight conversation length growth
Celebrate first time completing scenario without hints



This creates a positive feedback loop where the system gets smarter about each user's needs while keeping them motivated and speaking more.