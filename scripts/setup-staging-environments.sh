#!/bin/bash
# Stub wrapper – relocated to scripts/setup/setup-staging-environments.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/setup/setup-staging-environments.sh" "$@" 