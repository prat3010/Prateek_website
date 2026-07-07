#!/bin/bash
# Local Project Verification Script
# Exit immediately if any command fails (optional, but we can capture statuses and show a table at the end).

# Color formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "\n${BOLD}Starting full workspace verification...${NC}\n"

# Step 1: Git Status
echo -n "Checking Git status... "
if git diff-index --quiet HEAD --; then
  GIT_STATUS="${GREEN}✓ Clean${NC}"
else
  GIT_STATUS="${YELLOW}! Dirty (uncommitted files present)${NC}"
fi
echo -e "$GIT_STATUS"

# Step 2: Next.js Cache Cleanup
echo -n "Clearing Next.js build cache... "
rm -rf .next
echo -e "${GREEN}✓ Done${NC}"

# Step 3: TypeScript Compilation Check
echo -n "Running TypeScript type checks (tsc)... "
TSC_OUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?
if [ $TSC_EXIT -eq 0 ]; then
  TSC_STATUS="${GREEN}✓ Passed${NC}"
  echo -e "$TSC_STATUS"
else
  TSC_STATUS="${RED}✗ Failed${NC}"
  echo -e "$TSC_STATUS"
  echo -e "${RED}TypeScript Errors:${NC}\n$TSC_OUT\n"
fi

# Step 4: ESLint Code Quality Check
echo -n "Running ESLint check... "
LINT_OUT=$(npm run lint 2>&1)
LINT_EXIT=$?
if [ $LINT_EXIT -eq 0 ]; then
  LINT_STATUS="${GREEN}✓ Passed${NC}"
  echo -e "$LINT_STATUS"
else
  LINT_STATUS="${RED}✗ Failed (see below)${NC}"
  echo -e "$LINT_STATUS"
  echo -e "${YELLOW}ESLint Output (may include pre-existing failures):${NC}\n$LINT_OUT\n"
fi

# Step 5: Unit Tests
echo -n "Running unit tests (vitest)... "
TEST_OUT=$(npm test 2>&1)
TEST_EXIT=$?
if [ $TEST_EXIT -eq 0 ]; then
  TEST_STATUS="${GREEN}✓ Passed${NC}"
  echo -e "$TEST_STATUS"
else
  TEST_STATUS="${RED}✗ Failed${NC}"
  echo -e "$TEST_STATUS"
  echo -e "${RED}Test Failures:${NC}\n$TEST_OUT\n"
fi

# Step 6: Test Production Build
echo -n "Running trial production build... "
BUILD_OUT=$(npm run build 2>&1)
BUILD_EXIT=$?
if [ $BUILD_EXIT -eq 0 ]; then
  BUILD_STATUS="${GREEN}✓ Passed${NC}"
  echo -e "$BUILD_STATUS"
else
  BUILD_STATUS="${RED}✗ Failed${NC}"
  echo -e "$BUILD_STATUS"
  echo -e "${RED}Build Failure Details:${NC}\n$BUILD_OUT\n"
fi

# Summary Dashboard
echo -e "\n${BOLD}=========================================${NC}"
echo -e "         ${BOLD}VERIFICATION SUMMARY${NC}"
echo -e "${BOLD}=========================================${NC}"
echo -e "  Git Status:      $GIT_STATUS"
echo -e "  Type Checks:     $TSC_STATUS"
echo -e "  ESLint Check:    $LINT_STATUS"
echo -e "  Unit Tests:      $TEST_STATUS"
echo -e "  Prod Build:      $BUILD_STATUS"
echo -e "${BOLD}=========================================${NC}"

if [ $TSC_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $TEST_EXIT -eq 0 ] && [ $BUILD_EXIT -eq 0 ]; then
  echo -e "\n${GREEN}${BOLD}🎉 Verification Passed! Your changes are safe and ready to push.${NC}\n"
  exit 0
else
  echo -e "\n${RED}${BOLD}🚨 Verification Failed! Please resolve errors above before pushing.${NC}\n"
  exit 1
fi
