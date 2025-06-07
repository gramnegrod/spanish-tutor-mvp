// Load NPC data from JSON file
let npcData = null;

async function loadNPCData() {
    try {
        const response = await fetch('london_npcs.json');
        const data = await response.json();
        npcData = data.npcs;
        displayNPCs();
    } catch (error) {
        console.error('Error loading NPC data:', error);
        document.getElementById('npc-selection').innerHTML = 
            '<p style="color: red; text-align: center;">Error loading NPC data. Please check the console.</p>';
    }
}

function getUnsplashImage(npc) {
    // All verified working Unsplash London photos (tested with curl)
    const uniquePhotos = {
        'G1': 'https://tse1.mm.bing.net/th?id=OIP.PEpgVowLMJx_sbJG6wvUdQHaL4&w=474&h=474&c=7', // Tower of London custom image
        'G2': 'https://tse3.mm.bing.net/th?id=OIP.IUxxv9uq103bBjbCvoMP1QHaC8&r=0&w=188&h=188&c=7', // Tower Bridge custom image
        'G3': 'https://tse3.mm.bing.net/th/id/OIP.1lyidy-0Gl7zY9mtNDnweAHaE5?w=313&h=313&c=7', // St Paul's Cathedral custom image
        'G4': 'https://tse2.mm.bing.net/th?id=OIP.jX-sF6GN9DULStOFd4v8CQHaE8&w=316&h=316&c=7', // Shakespeare's Globe custom image
        'G5': 'https://tse1.mm.bing.net/th?id=OIP.w3GBV-AVZcgWhveuzVlsywHaEq&r=0&w=298&h=298&c=7', // Borough Market custom image
        'G6': 'https://tse3.mm.bing.net/th?id=OIP.Otr3BcKDur1fCm1gVMylCAHaGF&r=0&w=389&h=389&c=7', // Westminster Abbey custom image
        'G7': 'https://tse1.mm.bing.net/th/id/OIP.4ZYDeRe1k6tgbiu2L8ukSAHaFc?w=348&h=348&c=7', // Houses of Parliament custom image
        'G8': 'https://tse1.mm.bing.net/th?id=OIP.yp9Rmbj7kArSoppP9aHMHwHaEL&w=267&h=267&c=7', // Buckingham Palace custom image
        'G9': 'https://tse2.mm.bing.net/th?id=OIP.XL0QMiqk_OukPCe7te-_MAHaFc&r=0&w=348&h=348&c=7', // Churchill War Rooms custom image
        'G10': 'https://tse4.mm.bing.net/th?id=OIP.uJUNHlPjA4L6Q7WkLldqQwHaJ4&r=0&w=474&h=474&c=7', // National Gallery custom image
        'G11': 'https://tse2.mm.bing.net/th?id=OIP.PeZDc4Yt_LyjqesXDDj9zgHaL4&w=474&h=474&c=7', // Covent Garden custom image
        'G12': 'https://tse3.mm.bing.net/th?id=OIP.6x6SDufnwEmy3nHwfL83uAHaGE&w=388&h=388&c=7', // British Museum custom image
        'G13': 'https://tse1.mm.bing.net/th?id=OIP.bdw6Ir-THFkTEpLub5GfKQHaHK&w=458&h=458&c=7', // Camden Market custom image
        'G14': 'https://tse3.mm.bing.net/th?id=OIP.i0yD2q_5XkFwpC-GGkvPkQHaJK&r=0&w=474&h=474&c=7', // Greenwich Observatory custom image
        'G15': 'https://tse1.mm.bing.net/th/id/OIP.UTjd63MTlYvK5HVYSUxlWgHaGE?w=388&h=388&c=7', // Cutty Sark custom image
        'G16': 'https://tse1.mm.bing.net/th?id=OIP.la4TBWta1eL9fCtTvRfxJwHaFc&w=348&h=348&c=7', // Regent's Park custom image
        'G17': 'https://tse3.mm.bing.net/th?id=OIP.eded9uGtBP1nKfA5K77w8wHaF7&w=379&h=379&c=7', // Tate Modern custom image
        'G18': 'https://tse3.mm.bing.net/th?id=OIP.ckKAtSPZjBMlr0BfKRv1MAHaE8&r=0&w=316&h=316&c=7', // Sky Garden custom image
        'G19': 'https://tse4.mm.bing.net/th?id=OIP.dQLUeNBC0nv44Dsii3iHGwHaE8&w=316&h=316&c=7', // Kew Gardens custom image
        'G20': 'https://offloadmedia.feverup.com/secretldn.com/wp-content/uploads/2023/05/03171503/WARNER-BROS-DISCOVERING-HOGWARTS.jpg', // Harry Potter Studios custom image
        
        'G21': 'https://tse3.mm.bing.net/th?id=OIP.qi8Do37ikGdB7Ak6415VvwHaHa&w=474&h=474&c=7', // Software Engineer custom image
        
        // Service Staff
        'S1': 'https://tse1.mm.bing.net/th?id=OIP.Kish4_-eSmmhB1-TkljemwHaL4&w=474&h=474&c=7', // Heathrow Airport custom image
        'S2': 'https://tse1.mm.bing.net/th?id=OIP.XoPWAKPsQU1ib1_fKgKeDgHaE8&w=316&h=316&c=7', // London Hotel custom image
        'S3': 'https://tse4.mm.bing.net/th?id=OIP.TT237LVZu9J-7XMDEIsT4AHaE8&w=316&h=316&c=7', // Luxury Hotel Service custom image
        'S4': 'https://tse4.mm.bing.net/th/id/OIP.vR8MKxf6Ey2H50SuBN9YnwHaGE?r=0&w=388&h=388&c=7', // Traditional Pub custom image
        'S5': 'https://tse2.mm.bing.net/th?id=OIP.CkaAnj4CbTtudJD5w4YDKQHaFa&r=0&w=346&h=346&c=7'  // London Underground custom image
    };
    
    return uniquePhotos[npc.id] || 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop&crop=center';
}

function displayNPCs() {
    const grid = document.getElementById('npc-selection');
    
    grid.innerHTML = npcData.map((npc, index) => `
        <div class="npc-card" id="npc-${npc.id}" onclick="selectNPC('${npc.id}')">
            <div class="npc-role">${npc.role}</div>
        </div>
    `).join('');
    
    // Apply unique backgrounds after DOM is created
    setTimeout(() => {
        npcData.forEach(npc => {
            const element = document.getElementById(`npc-${npc.id}`);
            if (element) {
                element.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1)), url('${getUnsplashImage(npc)}')`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
            }
        });
    }, 100);
}

function extractName(personaPrompt) {
    // Extract name from persona prompt (e.g., "You are Beefeater Sergeant Thompson" -> "Sergeant Thompson")
    const match = personaPrompt.match(/You are ([^,]+)/);
    return match ? match[1] : 'Guide';
}

function selectNPC(npcId) {
    const npc = npcData.find(n => n.id === npcId);
    if (!npc) return;
    
    // Store selected NPC
    window.selectedNPC = npc;
    
    // Update chat interface
    document.getElementById('current-npc-name').textContent = extractName(npc.persona_prompt);
    document.getElementById('current-npc-role').textContent = npc.role;
    
    // Show chat interface
    document.getElementById('npc-selection').style.display = 'none';
    document.getElementById('chat-interface').style.display = 'block';
    
    // Reset transcript with new chat-style layout
    document.getElementById('transcript').innerHTML = `
        <div class="transcript-entry transcript-ai">
            <div class="message-container ai-message">
                <div class="speaker">${extractName(npc.persona_prompt)}</div>
                <div class="message-content">Click "Start Tour" to begin your conversation!</div>
            </div>
        </div>
    `;
}

function showNPCSelection() {
    // Stop any active conversation immediately and force cleanup
    if (typeof stopConversation === 'function') {
        stopConversation();
    }
    
    // Force disconnect if connection still exists
    if (window.realtimeConnection) {
        try {
            window.realtimeConnection.disconnect();
            window.realtimeConnection = null;
        } catch (error) {
            console.warn('Error disconnecting realtime connection:', error);
        }
    }
    
    // Hide status and reset UI
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
    
    // Show NPC grid
    document.getElementById('chat-interface').style.display = 'none';
    document.getElementById('npc-selection').style.display = 'grid';
    
    console.log('Returned to NPC selection - all connections should be stopped');
}

// Model selection functions
let selectedModel = 'gpt-4o-mini-realtime-preview-2024-12-17'; // Default to mini

function selectModel(modelName) {
    selectedModel = modelName;
    
    // Update UI
    document.querySelectorAll('.model-btn').forEach(btn => {
        btn.classList.remove('model-selected');
    });
    
    if (modelName.includes('mini')) {
        document.getElementById('model-mini').classList.add('model-selected');
        document.getElementById('current-model').textContent = 'GPT-4o Mini Realtime';
    } else {
        document.getElementById('model-full').classList.add('model-selected');
        document.getElementById('current-model').textContent = 'GPT-4o Realtime';
    }
    
    // Store selection in localStorage
    localStorage.setItem('selectedModel', modelName);
    
    console.log('Model selected:', modelName);
}

function loadModelPreference() {
    const saved = localStorage.getItem('selectedModel');
    if (saved) {
        selectModel(saved);
    }
}

// Load NPCs when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadModelPreference();
    loadNPCData();
});