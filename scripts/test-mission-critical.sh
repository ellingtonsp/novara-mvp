#!/bin/bash
# Stub wrapper – relocated to scripts/testing/test-mission-critical.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/testing/test-mission-critical.sh" "$@"
