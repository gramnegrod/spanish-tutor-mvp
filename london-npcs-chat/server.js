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

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`London NPCs Chat server running on http://localhost:${PORT}`);
});