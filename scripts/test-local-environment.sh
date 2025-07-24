#!/bin/bash
# Stub wrapper – relocated to scripts/testing/test-local-environment.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/testing/test-local-environment.sh" "$@"
