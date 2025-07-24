#!/bin/bash
# Stub wrapper – relocated to scripts/setup/setup-branch-protection.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/setup/setup-branch-protection.sh" "$@" 