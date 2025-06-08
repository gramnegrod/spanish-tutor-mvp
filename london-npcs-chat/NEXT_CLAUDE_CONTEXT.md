# Context for Next Claude Session

## Current Situation
User is building a voice chat app using OpenAI's Realtime API. The app works well for voice conversations but has a critical limitation: the user wants to discuss large documents (book chapters) with the AI, but sending large text causes the WebRTC connection to fail.

## Immediate Problem
- User sent a book chapter via text input
- Connection dropped after AI response
- Pattern: `connected` → `response.done` → `disconnected` → `failed`
- New ephemeral key needed after each failure
- All context lost on reconnection

## User's Core Need
"I love the realtime advanced model's ease and proficiency of STS (Speech-to-Speech)... My main goal is to just talk to the model easily (STS) and talk about domain specific knowledge that might be a large amount like tens of thousands tokens."

## Recommended Solution: Dual-Model Architecture
1. **Realtime API** = Voice interface (speech recognition + synthesis)
2. **GPT-4 API** = Brain (handles large context + reasoning)
3. **Orchestrator** = Routes between them

## Current Code State
- Text input feature implemented and working for small text
- Connection monitoring and logging added
- Auto-reconnection attempted but not ideal solution
- All code in `/london-npcs-chat/` directory

## Next Actions
1. Implement `/api/book-analysis` endpoint in server.js
2. Add orchestration logic to route complex queries to GPT-4
3. Update Realtime instructions with GPT-4 responses
4. Test with actual book content

## Key Files
- `app.js` - Has text input handling and WebRTC connection
- `server.js` - Needs new endpoint for GPT-4 integration
- `REALTIME_CONTEXT_SOLUTION.md` - Full solution design

## Important: What NOT to Change
- WebRTC connection approach (it's working well)
- Voice interaction flow
- Basic app structure

## User's Preference
- Likes brainstorming and discussion before implementation
- Wants to understand "why" before "how"
- Values working solutions over theoretical perfection

## Technical Context
- Using WebRTC (not WebSocket) for Realtime API
- Express server on port 3001
- Vanilla JavaScript (no frameworks)
- 26 London NPC personalities for testing