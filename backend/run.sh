#!/usr/bin/env bash
# Fitness backend launcher — checks prerequisites step by step, then starts the API server.
# Database and tables are created automatically on startup (see config/database.go).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

STEP=0
FAILURES=0

step() {
  STEP=$((STEP + 1))
  printf "${CYAN}[%d] %s${NC}\n" "$STEP" "$1"
}

ok() {
  printf "    ${GREEN}OK${NC} %s\n" "$1"
}

warn() {
  printf "    ${YELLOW}WARN${NC} %s\n" "$1"
}

fail() {
  FAILURES=$((FAILURES + 1))
  printf "    ${RED}FAIL${NC} %s\n" "$1"
}

die() {
  fail "$1"
  echo ""
  echo "Fix the issue above and run ./run.sh again."
  exit 1
}

read_env_var() {
  local key="$1"
  local default="$2"
  local line value

  if [[ ! -f .env ]]; then
    echo "$default"
    return
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" ]] && continue
    if [[ "$line" == "${key}="* ]]; then
      value="${line#*=}"
      value="$(echo "$value" | sed 's/^["'\'']//;s/["'\'']$//')"
      echo "$value"
      return
    fi
  done < .env

  echo "$default"
}

check_tcp_port() {
  local host="$1"
  local port="$2"

  if command -v nc >/dev/null 2>&1; then
    nc -z -w 3 "$host" "$port" >/dev/null 2>&1
    return $?
  fi

  if (echo >/dev/tcp/"$host"/"$port") 2>/dev/null; then
    return 0
  fi

  return 1
}

version_ge() {
  printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

echo "========================================"
echo " Fitness Backend — prerequisite checks"
echo "========================================"
echo ""

# 1. Go installed
step "Checking Go installation"
if ! command -v go >/dev/null 2>&1; then
  die "Go is not installed. Install Go 1.24+ from https://go.dev/dl/"
fi
GO_VERSION="$(go version | awk '{print $3}' | sed 's/^go//')"
ok "Go ${GO_VERSION} found ($(command -v go))"

# 2. Go version
step "Checking Go version (need >= 1.24)"
if ! version_ge "$GO_VERSION" "1.24"; then
  die "Go ${GO_VERSION} is too old. This project requires Go 1.24 or newer."
fi
ok "Go version satisfies requirement"

# 3. go.mod present
step "Checking project layout"
if [[ ! -f go.mod ]]; then
  die "go.mod not found. Run this script from the backend/ directory."
fi
if [[ ! -f cmd/main.go ]]; then
  die "cmd/main.go not found."
fi
ok "backend module layout looks correct"

# 4. Environment file
step "Checking environment file (.env)"
if [[ ! -f .env ]]; then
  if [[ -f env.example ]]; then
    cp env.example .env
    warn ".env was missing — created from env.example"
    warn "Edit .env if your MySQL user/password differ from the defaults"
  else
    die ".env is missing and env.example was not found"
  fi
else
  ok ".env exists"
fi

DB_HOST="$(read_env_var DB_HOST localhost)"
DB_PORT="$(read_env_var DB_PORT 3306)"
DB_USER="$(read_env_var DB_USER root)"
DB_NAME="$(read_env_var DB_NAME fitness_db)"
PORT="$(read_env_var PORT 8080)"

# 5. MySQL reachable
step "Checking MySQL server (${DB_HOST}:${DB_PORT})"
if check_tcp_port "$DB_HOST" "$DB_PORT"; then
  ok "MySQL port is open on ${DB_HOST}:${DB_PORT}"
else
  die "Cannot reach MySQL at ${DB_HOST}:${DB_PORT}. Start MySQL and verify DB_HOST/DB_PORT in .env"
fi

# 6. Go module dependencies
step "Downloading Go module dependencies"
if go mod download; then
  ok "Dependencies ready"
else
  die "go mod download failed"
fi

# 7. Verify module builds
step "Verifying backend compiles"
if go build -o /dev/null ./cmd; then
  ok "Build check passed"
else
  die "go build ./cmd failed"
fi

# 8. Uploads directory
step "Preparing upload directory"
UPLOAD_DIR="$(read_env_var UPLOAD_DIR uploads)"
mkdir -p "$UPLOAD_DIR"
ok "Upload directory ready: ${UPLOAD_DIR}/"

echo ""
if [[ "$FAILURES" -gt 0 ]]; then
  die "${FAILURES} check(s) failed"
fi

echo "========================================"
echo " All checks passed — starting server"
echo "========================================"
echo ""
echo "  API:     http://localhost:${PORT}"
echo "  Swagger: http://localhost:${PORT}/swagger/index.html"
echo "  DB:      ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""
echo "  Database and tables are created automatically if missing."
echo "  Default admin: admin@gmail.com / 12345678"
echo ""
echo "Press Ctrl+C to stop."
echo ""

exec go run ./cmd
