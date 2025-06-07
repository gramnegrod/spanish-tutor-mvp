# London NPCs Chat

A simple web application to chat with 25 London tour guide NPCs using OpenAI's Realtime API.

## Features

- 25 unique London NPCs with detailed personalities
- Voice-based conversations using WebRTC
- Simple HTML/CSS interface
- No authentication or database required
- Mobile-friendly design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy your OpenAI API key to `.env.local`:
```bash
OPENAI_API_KEY=your_key_here
```

3. Start the server:
```bash
npm start
```

4. Open http://localhost:3001

## NPCs Include

- Tower of London Beefeater
- Tower Bridge Engineer
- St Paul's Cathedral Dome Guide
- Shakespeare's Globe Actor
- Borough Market Food Guide
- Westminster Abbey Canon
- Parliament Education Officer
- Buckingham Palace Guard
- Churchill War Rooms Historian
- National Gallery Curator
- And 15 more!

## Usage

1. Select an NPC from the grid
2. Click "Start Tour" 
3. Speak with your microphone
4. Have a conversation in Spanish or English
5. Each NPC stays in character as a London tour guide

## Technical Details

- Uses OpenAI Realtime API with WebRTC
- Vanilla JavaScript (no frameworks)
- Express.js backend for API proxy
- Responsive CSS Grid layout