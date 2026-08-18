#!/usr/bin/env bash
# ==============================================================================
# Local Security Audit Script using Strix AI Penetration Framework (usestrix/strix)
# ==============================================================================
# Usage:
#   bash scripts/security_audit_strix.sh [--mode quick|standard|deep] [--target http://localhost:3000] [--max-budget 5]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SCAN_MODE="quick"
TARGET_URL="http://localhost:3000"
MAX_BUDGET=""
INSTRUCTION="Focus on Next.js 16 API routes (/api/client/*, /api/contact, /api/terminal/*), Supabase session verification, CSRF, and XSS."
REPORTS_DIR="${ROOT_DIR}/.strix_reports"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      SCAN_MODE="$2"
      shift 2
      ;;
    --target)
      TARGET_URL="$2"
      shift 2
      ;;
    --max-budget)
      MAX_BUDGET="$2"
      shift 2
      ;;
    --instruction)
      INSTRUCTION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: bash scripts/security_audit_strix.sh [--mode quick|standard|deep] [--target <url>] [--max-budget <usd>]"
      exit 1
      ;;
  esac
done

echo "=========================================================="
echo " Starting Strix Security Audit (Prateek_website)"
echo " Target: ${TARGET_URL}"
echo " Mode:   ${SCAN_MODE}"
echo "=========================================================="

# 1. Check Docker status
if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker Desktop/Engine first."
  exit 1
fi
echo "✓ Docker is running."

# 2. Configure LLM & OpenRouter Key
export STRIX_LLM="${STRIX_LLM:-openrouter/anthropic/claude-3.5-sonnet}"
if [[ -n "${OPENROUTER_API_KEY:-}" ]] && [[ -z "${LLM_API_KEY:-}" ]]; then
  export LLM_API_KEY="${OPENROUTER_API_KEY}"
fi

if [[ -z "${LLM_API_KEY:-}" ]] && [[ -z "${OPENAI_API_KEY:-}" ]] && [[ -z "${ANTHROPIC_API_KEY:-}" ]] && [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "⚠️ Warning: No LLM API Key detected in environment!"
  echo "   Please export your key, e.g.: export OPENROUTER_API_KEY=\"your_key_here\""
fi

mkdir -p "${REPORTS_DIR}"

# 3. Build Strix command args
CMD_ARGS=(
  "--target" "${TARGET_URL}"
  "--target" "${ROOT_DIR}/src"
  "--scan-mode" "${SCAN_MODE}"
  "--non-interactive"
  "--instruction" "${INSTRUCTION}"
)

if [[ -n "${MAX_BUDGET}" ]]; then
  CMD_ARGS+=("--max-budget" "${MAX_BUDGET}")
fi

echo "=========================================================="
echo " Executing Strix Agent Scan..."
echo "=========================================================="

if command -v strix >/dev/null 2>&1; then
  strix "${CMD_ARGS[@]}" || true
else
  uvx --from strix-agent strix "${CMD_ARGS[@]}" || true
fi

echo "=========================================================="
echo " Scan Complete! Reports saved in ./strix_runs/"
echo "=========================================================="
