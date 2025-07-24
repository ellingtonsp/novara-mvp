#!/bin/bash
# Stub wrapper – relocated to scripts/setup/setup-git-hooks.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/setup/setup-git-hooks.sh" "$@" 