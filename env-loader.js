// Load environment variables before Next.js starts
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    }
  }
}

// Load .env.local first (highest priority)
loadEnvFile(path.join(__dirname, '.env.local'));

// Then load .env as fallback
loadEnvFile(path.join(__dirname, '.env'));

console.log('Environment loaded:', {
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  keyLength: process.env.OPENAI_API_KEY?.length || 0
});