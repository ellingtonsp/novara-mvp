#!/bin/bash
# Stub wrapper – relocated to scripts/testing/test-api-endpoints-demo.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/testing/test-api-endpoints-demo.sh" "$@"
