-- Seed data for Spanish Tutor MVP
-- This file runs after migrations when using supabase db reset

-- Insert sample progress data for testing (optional)
-- Note: This would only work if there are actual users in auth.users
-- For now, we'll keep this empty and let the application create data dynamically

-- Example seed data (commented out - uncomment when you have real users):
/*
-- Sample vocabulary for testing
INSERT INTO progress (user_id, vocabulary, pronunciation, grammar, fluency, cultural_knowledge) 
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  '["hola", "gracias", "por favor", "taco", "quesadilla"]',
  25,
  30,
  20,
  15
) ON CONFLICT (user_id) DO NOTHING;

-- Sample conversation for testing
INSERT INTO conversations (user_id, title, persona, transcript, duration)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Sample Taco Order',
  'TAQUERO',
  '[
    {"id": "1", "speaker": "assistant", "text": "¡Hola! ¿Qué tal? ¿Qué te puedo servir?", "timestamp": "2025-01-30T12:00:00Z"},
    {"id": "2", "speaker": "user", "text": "Hola, quisiera un taco de pollo por favor", "timestamp": "2025-01-30T12:00:05Z"},
    {"id": "3", "speaker": "assistant", "text": "¡Perfecto! ¿Con qué salsa lo quieres?", "timestamp": "2025-01-30T12:00:08Z"}
  ]',
  30
) ON CONFLICT DO NOTHING;
*/

-- For now, this file serves as a placeholder for future seed data