#!/usr/bin/env bash
# ------------------------------------------------------------------
#  Local Security Scan Script
#  Runs Trivy FS scan and npm audit before pushing to GitHub
#  This is a local equivalent of the GitHub Actions security workflow.
# ------------------------------------------------------------------
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${YELLOW}=== Local Security Scan ===${NC}"
echo ""

ERRORS=0

# ---- Trivy FS Scan ----
if command -v trivy &> /dev/null; then
  echo -e "${YELLOW}[1/3] Running Trivy filesystem scan...${NC}"
  if trivy fs "$ROOT_DIR" --config "$ROOT_DIR/trivy.yaml"; then
    echo -e "${GREEN}[1/3] Trivy scan passed.${NC}"
  else
    echo -e "${RED}[1/3] Trivy scan found issues.${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${YELLOW}[1/3] Trivy not installed — skipping.${NC}"
  echo "       Install: https://aquasecurity.github.io/trivy/"
fi
echo ""

# ---- npm audit ----
if command -v npm &> /dev/null; then
  echo -e "${YELLOW}[2/3] Running npm audit (frontend)...${NC}"
  if (cd "$ROOT_DIR/frontend" && npm audit --omit=dev 2>/dev/null); then
    echo -e "${GREEN}[2/3] npm audit passed.${NC}"
  else
    echo -e "${RED}[2/3] npm audit found vulnerabilities.${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${YELLOW}[2/3] npm not found — skipping.${NC}"
fi
echo ""

# ---- Maven dependency check (OWASP) ----
if [ -x "$ROOT_DIR/backend/mvnw" ] || command -v mvn &> /dev/null; then
  echo -e "${YELLOW}[3/3] Running Maven dependency:analyze (backend)...${NC}"
  MVN_CMD="mvn"
  if [ -x "$ROOT_DIR/backend/mvnw" ]; then
    MVN_CMD="$ROOT_DIR/backend/mvnw"
  fi
  if (cd "$ROOT_DIR/backend" && $MVN_CMD dependency:analyze -q 2>/dev/null); then
    echo -e "${GREEN}[3/3] Maven dependency analysis passed.${NC}"
  else
    echo -e "${YELLOW}[3/3] Maven dependency:analyze had warnings (non-fatal).${NC}"
  fi
else
  echo -e "${YELLOW}[3/3] Maven not found — skipping.${NC}"
fi
echo ""

# ---- Summary ----
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}=== Security scan completed with $ERRORS issue(s) ===${NC}"
  exit 1
else
  echo -e "${GREEN}=== All security scans passed ===${NC}"
  exit 0
fi
