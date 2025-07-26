# Navigation Structure and UX Flow Analysis

## Current State Analysis

### 1. Page Structure

#### Homepage (`/src/app/page.tsx`)
- **For Logged-in Users**: Shows 3 buttons:
  1. "🗺️ Choose Your Adventure" → `/practice-v2/select-npc` (Blue-purple gradient)
  2. "🌮 Classic Taquero" → `/practice` (Default style)
  3. "🧠 Adaptive Learning" → `/adaptive-practice` (Purple)
  
- **For Logged-out Users**: Shows 3 buttons:
  1. "🗺️ Explore All Characters - Free!" → `/practice-v2/select-npc` (Blue-purple gradient)
  2. "🌮 Quick Taquero Practice" → `/practice-no-auth` (Orange-red gradient)
  3. "Sign In" → `/login` (Outline style)

- **Additional CTAs**:
  - Section "11 Authentic Mexico City Characters" with button "🗺️ Choose Your Character" → `/practice-v2/select-npc`
  - Preview of 6 NPCs with "See All 11 Characters →" button → `/practice-v2/select-npc`

#### Dashboard (`/src/app/dashboard/page.tsx`)
- **For Logged-in Users**: Shows 2 main action cards:
  1. "Quick Practice" → `/practice-v2?dest=mexico-city&npc=taco_vendor`
  2. "🇲🇽 Mexico City Adventure" → `/practice-v2/select-npc`

### 2. Navigation Components

#### Global Layout
- No persistent global navigation bar
- Layout only provides background gradient and Providers wrapper

#### Header Components
- `AuthHeader`: Shows for authenticated users during practice
  - "Dashboard" button → `/dashboard`
  - User email + Sign Out button
  
- `GuestModeHeader`: Shows for non-authenticated users during practice
  - "Home" button → `/`
  - "Sign In" and "Sign Up Free" buttons

- **Note**: Headers are only used within practice pages, not globally

#### User Menu (`/src/components/ui/user-menu.tsx`)
- Exists but appears to be unused in current implementation
- Contains dropdown with Dashboard, Settings, and Sign Out options

### 3. User Journey Analysis

#### New User (Logged Out)
1. **Discovery Path**:
   - Homepage → See button "🗺️ Explore All Characters - Free!"
   - Homepage → Scroll to "11 Authentic Mexico City Characters" section
   - Direct URL if they know it: `/practice-v2/select-npc`

2. **Visibility**: Good - Multiple clear CTAs on homepage

#### Returning User (Logged In)
1. **Discovery Path**:
   - Homepage → "🗺️ Choose Your Adventure" button
   - Dashboard → "🇲🇽 Mexico City Adventure" card
   - Direct URL: `/practice-v2/select-npc`

2. **Visibility**: Good from homepage, Good from dashboard

### 4. Issues Identified

1. **No Global Navigation**
   - Users must return to homepage or dashboard to access NPC selector
   - No persistent way to switch between features once in a practice session

2. **Limited Header Navigation**
   - Headers only appear in practice pages
   - No way to access NPC selector from practice pages directly

3. **Button Visibility Concerns**
   - The user's complaint about "no purple button" might be due to:
     - Gradient buttons (blue-purple) might not appear clearly purple
     - Buttons might be below the fold on smaller screens
     - No persistent navigation making feature feel hidden

### 5. Navigation Flow Map

```
Home (/)
├── Logged In
│   ├── Choose Your Adventure → /practice-v2/select-npc
│   ├── Classic Taquero → /practice
│   └── Adaptive Learning → /adaptive-practice
│
├── Logged Out
│   ├── Explore All Characters → /practice-v2/select-npc
│   ├── Quick Taquero → /practice-no-auth
│   └── Sign In → /login
│
└── Character Preview Section
    └── Choose Your Character → /practice-v2/select-npc

Dashboard (/dashboard)
├── Quick Practice → /practice-v2?dest=mexico-city&npc=taco_vendor
└── Mexico City Adventure → /practice-v2/select-npc

Practice Pages
├── AuthHeader (if logged in)
│   └── Dashboard → /dashboard
└── GuestModeHeader (if logged out)
    └── Home → /
```

### 6. Recommendations

1. **Add Global Navigation Bar**
   - Include persistent access to:
     - Home/Dashboard
     - Browse NPCs
     - My Progress
     - Account

2. **Make NPC Selector More Prominent**
   - Add dedicated "Browse Characters" button in header
   - Use consistent purple branding for this feature
   - Add icon/badge showing number of available NPCs

3. **Improve Practice Page Navigation**
   - Add "Switch Character" button in practice sessions
   - Show other available NPCs in sidebar or dropdown

4. **Enhanced Visual Hierarchy**
   - Make the NPC selector the primary CTA
   - Use distinctive purple button as user mentioned
   - Ensure button is above the fold on all devices

5. **Quick Access Points**
   - Add NPC grid/carousel on dashboard
   - Include "Popular NPCs" section
   - Show "Continue where you left off" for returning users