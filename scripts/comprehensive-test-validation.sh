#!/bin/bash

# Comprehensive Test Validation Script
# Tests all recent changes and integrations

echo "🚀 Starting Comprehensive Test Validation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Track overall success
OVERALL_SUCCESS=0

echo -e "${BLUE}📋 Test Plan:${NC}"
echo "1. TypeScript compilation check"
echo "2. ESLint validation"
echo "3. Unit tests for all components"
echo "4. Integration tests"
echo "5. Build process verification"
echo "6. Key user flow validation"
echo ""

# 1. TypeScript Compilation Check
echo -e "${YELLOW}1. Checking TypeScript compilation...${NC}"
npx tsc --noEmit --skipLibCheck
print_status $? "TypeScript compilation" || OVERALL_SUCCESS=1

# 2. ESLint Validation
echo -e "${YELLOW}2. Running ESLint validation...${NC}"
npm run lint
print_status $? "ESLint validation" || OVERALL_SUCCESS=1

# 3. Run all unit tests
echo -e "${YELLOW}3. Running unit tests...${NC}"
npm test -- --passWithNoTests --coverage --watchAll=false
print_status $? "Unit tests" || OVERALL_SUCCESS=1

# 4. Run integration tests specifically
echo -e "${YELLOW}4. Running integration tests...${NC}"
npm test -- --testPathPattern=integration-comprehensive --watchAll=false
print_status $? "Integration tests" || OVERALL_SUCCESS=1

# 5. Build process verification
echo -e "${YELLOW}5. Testing build process...${NC}"
npm run build
print_status $? "Build process" || OVERALL_SUCCESS=1

# 6. Test key components individually
echo -e "${YELLOW}6. Testing key components...${NC}"

# Test useConversationState hook
echo "  - Testing useConversationState hook..."
npm test -- --testPathPattern=useConversationState --watchAll=false --silent
print_status $? "  useConversationState hook" || OVERALL_SUCCESS=1

# Test Spanish analysis service
echo "  - Testing Spanish analysis service..."
npm test -- --testPathPattern=spanish-analysis --watchAll=false --silent
print_status $? "  Spanish analysis service" || OVERALL_SUCCESS=1

# Test OpenAI realtime service
echo "  - Testing OpenAI realtime service..."
npm test -- --testPathPattern=openai-realtime --watchAll=false --silent
print_status $? "  OpenAI realtime service" || OVERALL_SUCCESS=1

# Test NPC system
echo "  - Testing NPC system..."
npm test -- --testPathPattern=npc-system --watchAll=false --silent
print_status $? "  NPC system" || OVERALL_SUCCESS=1

# Test Language Learning DB
echo "  - Testing Language Learning DB..."
npm test -- --testPathPattern=LanguageLearningDB --watchAll=false --silent
print_status $? "  Language Learning DB" || OVERALL_SUCCESS=1

# 7. Manual verification prompts
echo -e "${YELLOW}7. Manual verification required:${NC}"
echo "   Please verify the following manually:"
echo "   □ Navigate to http://localhost:3000 after running 'npm run dev'"
echo "   □ Test starting a conversation"
echo "   □ Test voice recording functionality"
echo "   □ Test Spanish analysis feedback"
echo "   □ Test session statistics updates"
echo "   □ Test NPC switching"
echo "   □ Test conversation storage"

# 8. Check for any missing files or broken imports
echo -e "${YELLOW}8. Checking for missing files and broken imports...${NC}"
echo "  - Checking critical files exist..."

CRITICAL_FILES=(
    "src/hooks/useConversationState.ts"
    "src/services/openai-realtime.ts"
    "src/lib/spanish-analysis/index.ts"
    "src/lib/language-learning-db/index.ts"
    "src/lib/npc-system/index.ts"
)

MISSING_FILES=0
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}   ❌ Missing: $file${NC}"
        MISSING_FILES=1
        OVERALL_SUCCESS=1
    else
        echo -e "${GREEN}   ✅ Found: $file${NC}"
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}   ✅ All critical files present${NC}"
fi

# 9. Check package.json scripts
echo -e "${YELLOW}9. Verifying package.json scripts...${NC}"
REQUIRED_SCRIPTS=("dev" "build" "start" "lint" "test")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if npm run-script --silent 2>/dev/null | grep -q "^  $script$"; then
        echo -e "${GREEN}   ✅ Script '$script' available${NC}"
    else
        echo -e "${RED}   ❌ Script '$script' missing${NC}"
        OVERALL_SUCCESS=1
    fi
done

# 10. Environment variables check
echo -e "${YELLOW}10. Checking environment setup...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}   ✅ .env.local file exists${NC}"
else
    echo -e "${YELLOW}   ⚠️  .env.local file not found (may be intentional)${NC}"
fi

# Final summary
echo ""
echo "=========================================="
if [ $OVERALL_SUCCESS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    echo -e "${GREEN}✅ The application is ready for use${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed or require attention${NC}"
    echo -e "${YELLOW}Please review the failed tests above${NC}"
    exit 1
fi