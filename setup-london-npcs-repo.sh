#!/bin/bash

# Setup script for london-npcs-realtime-chat repository

echo "🚀 Setting up london-npcs-realtime-chat repository..."

# Navigate to the new directory
cd /Users/rodneyfranklin/Development/personal/london-npcs-realtime-chat

# Initialize git repository
echo "📁 Initializing git repository..."
git init

# Create initial commit
echo "📝 Creating initial commit..."
git add .
git commit -m "Initial commit: London NPCs Realtime Chat

- WebRTC-based voice chat with OpenAI Realtime API
- 26 unique London tour guide personalities
- Text input support for short messages
- Model selection (GPT-4o vs GPT-4o Mini)
- Comprehensive documentation for dual-model architecture
- Ready for GPT-4 integration for large context handling"

# Create GitHub repository
echo "🌐 Creating private GitHub repository..."
gh repo create london-npcs-realtime-chat --private --description "Voice chat with London tour guide NPCs using OpenAI Realtime API" --confirm

# Set origin and push
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo "✅ Repository setup complete!"
echo "📍 Location: /Users/rodneyfranklin/Development/personal/london-npcs-realtime-chat"
echo "🔗 GitHub: https://github.com/$(gh api user --jq .login)/london-npcs-realtime-chat"