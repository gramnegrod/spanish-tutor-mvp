// Simple Node.js server for OpenAI session endpoint
const express = require('express');
const path = require('path');
require('dotenv').config();

// Debug environment loading
console.log('Environment loaded:', {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
});

// Fallback: if dotenv fails, set API key directly
if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = '***REMOVED***';
    console.log('API key set via fallback');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Session endpoint for OpenAI Realtime API (using GET like main project)
app.get('/api/session', async (req, res) => {
    const requestedModel = req.query.model || 'gpt-4o-mini-realtime-preview-2024-12-17';
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        console.log('Session API - Environment check:', {
            hasApiKey: !!apiKey,
            keyLength: apiKey?.length,
            requestedModel: requestedModel
        });
        
        if (!apiKey) {
            console.error('No OpenAI API key found in environment variables');
            return res.status(500).json({ 
                error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
            });
        }

        const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: requestedModel,
                voice: 'alloy'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenAI API error:', {
                status: response.status,
                statusText: response.statusText,
                error
            });
            return res.status(response.status).json({ 
                error: `Failed to create session: ${response.status} ${response.statusText}` 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// Book Analysis endpoint for GPT-4.1 (large document processing)
app.post('/api/book-analysis', async (req, res) => {
    try {
        const { bookContent, userQuestion, npcPersonality } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;
        
        console.log('Book Analysis API - Request:', {
            hasApiKey: !!apiKey,
            hasBookContent: !!bookContent,
            bookContentLength: bookContent?.length || 0,
            userQuestion: userQuestion?.substring(0, 100) + '...',
            npcPersonality: npcPersonality?.role || 'Unknown'
        });
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured.' 
            });
        }

        if (!bookContent || !userQuestion || !npcPersonality) {
            return res.status(400).json({ 
                error: 'Missing required fields: bookContent, userQuestion, and npcPersonality are required.' 
            });
        }

        // Create GPT-4.1 prompt that combines book content, user question, and NPC personality
        const systemPrompt = `You are ${npcPersonality.role} - ${npcPersonality.persona_prompt}

IMPORTANT CONTEXT: The user has provided a book or document that they want to discuss. Your job is to:
1. Answer their question about the book content using your London NPC personality
2. Stay in character as a knowledgeable London tour guide
3. Relate the book content to London history, culture, or locations when relevant
4. Provide a comprehensive but conversational response

BOOK/DOCUMENT CONTENT:
${bookContent}

USER'S QUESTION ABOUT THE CONTENT:
${userQuestion}

Respond as ${npcPersonality.role} would, incorporating your London expertise while addressing their question about the book content.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4.1',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('GPT-4.1 API error:', {
                status: response.status,
                statusText: response.statusText,
                error
            });
            return res.status(response.status).json({ 
                error: `Failed to analyze book content: ${response.status} ${response.statusText}` 
            });
        }

        const data = await response.json();
        const analysisResult = data.choices[0]?.message?.content;

        if (!analysisResult) {
            return res.status(500).json({ 
                error: 'No analysis result received from GPT-4.1' 
            });
        }

        console.log('Book Analysis API - Success:', {
            responseLength: analysisResult.length,
            tokensUsed: data.usage?.total_tokens || 'unknown'
        });

        res.json({
            analysis: analysisResult,
            usage: data.usage,
            model: 'gpt-4.1',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Book analysis error:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-fresh.html'));
});

app.listen(PORT, () => {
    console.log(`London NPCs Chat server running on http://localhost:${PORT}`);
});