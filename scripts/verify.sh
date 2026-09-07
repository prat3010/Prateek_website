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

# Step 6: Dead Code & Dependency Audit (Knip)
echo -n "Running Dead Code & Dependency audit (knip)... "
KNIP_OUT=$(npx knip --reporter compact 2>&1)
KNIP_EXIT=$?
if [ $KNIP_EXIT -eq 0 ]; then
  KNIP_STATUS="${GREEN}✓ Clean${NC}"
  echo -e "$KNIP_STATUS"
else
  KNIP_STATUS="${YELLOW}! Unused items found (non-blocking)${NC}"
  echo -e "$KNIP_STATUS"
fi

# Step 7: Portal Containing Block Safety Audit (ADR 05)
echo -n "Running Portal Containing Block Safety audit... "
PORTAL_OUT=$(python3 scripts/audit_portal_safety.py 2>&1)
PORTAL_EXIT=$?
if [ $PORTAL_EXIT -eq 0 ]; then
  PORTAL_STATUS="${GREEN}✓ Passed (0 traps)${NC}"
  echo -e "$PORTAL_STATUS"
else
  PORTAL_STATUS="${RED}✗ Failed${NC}"
  echo -e "$PORTAL_STATUS"
  echo -e "${RED}Portal Safety Violations:${NC}\n$PORTAL_OUT\n"
fi

# Step 8: Secret & Credential Leak Scanner
echo -n "Running Secret & Credential Leak audit... "
SECRET_OUT=$(python3 scripts/audit_secrets.py 2>&1)
SECRET_EXIT=$?
if [ $SECRET_EXIT -eq 0 ]; then
  SECRET_STATUS="${GREEN}✓ Passed (0 leaks)${NC}"
  echo -e "$SECRET_STATUS"
else
  SECRET_STATUS="${RED}✗ Failed${NC}"
  echo -e "$SECRET_STATUS"
  echo -e "${RED}Secret Leak Violations:${NC}\n$SECRET_OUT\n"
fi

# Step 9: Data Contract Integrity & Architecture Map Audit
echo -n "Running Data Contract & Architecture Map audit... "
AUDIT_OUT=$(python3 scripts/audit_contracts.py && python3 scripts/sync_graph_with_code.py 2>&1)
AUDIT_EXIT=$?
if [ $AUDIT_EXIT -eq 0 ]; then
  AUDIT_STATUS="${GREEN}✓ Passed (100% Synced)${NC}"
  echo -e "$AUDIT_STATUS"
else
  AUDIT_STATUS="${RED}✗ Failed${NC}"
  echo -e "$AUDIT_STATUS"
  echo -e "${RED}Contract Audit Failure Details:${NC}\n$AUDIT_OUT\n"
fi

# Step 10: Zero-Toy & Authentic Engineering Audit
echo -n "Running Zero-Toy & Anti-Mock audit... "
ZERO_TOY_OUT=$(python3 scripts/audit_zero_toy.py 2>&1)
ZERO_TOY_EXIT=$?
if [ $ZERO_TOY_EXIT -eq 0 ]; then
  ZERO_TOY_STATUS="${GREEN}✓ Passed (0 toys)${NC}"
  echo -e "$ZERO_TOY_STATUS"
else
  ZERO_TOY_STATUS="${RED}✗ Failed${NC}"
  echo -e "$ZERO_TOY_STATUS"
  echo -e "${RED}Zero-Toy Audit Violations:${NC}\n$ZERO_TOY_OUT\n"
fi

# Summary Dashboard
echo -e "\n${BOLD}=========================================${NC}"
echo -e "         ${BOLD}VERIFICATION SUMMARY${NC}"
echo -e "${BOLD}=========================================${NC}"
echo -e "  Git Status:      $GIT_STATUS"
echo -e "  Type Checks:     $TSC_STATUS"
echo -e "  ESLint Check:    $LINT_STATUS"
echo -e "  Unit Tests:      $TEST_STATUS"
echo -e "  Dead Code Audit: $KNIP_STATUS"
echo -e "  Portal Safety:   $PORTAL_STATUS"
echo -e "  Secret Scanner:  $SECRET_STATUS"
echo -e "  Contract Audit:  $AUDIT_STATUS"
echo -e "  Zero-Toy Audit:  $ZERO_TOY_STATUS"
echo -e "${BOLD}=========================================${NC}"

if [ $TSC_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $TEST_EXIT -eq 0 ] && [ $PORTAL_EXIT -eq 0 ] && [ $SECRET_EXIT -eq 0 ] && [ $AUDIT_EXIT -eq 0 ] && [ $ZERO_TOY_EXIT -eq 0 ]; then
  echo -e "\n${GREEN}${BOLD}🎉 Verification Passed! All automated quality gates are 100% green.${NC}\n"
  exit 0
else
  echo -e "\n${RED}${BOLD}🚨 Verification Failed! Please resolve errors above before pushing.${NC}\n"
  exit 1
fi
