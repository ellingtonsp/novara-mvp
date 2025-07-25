#!/bin/bash
# Stub wrapper – relocated to scripts/testing/api-endpoint-test.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/testing/api-endpoint-test.sh" "$@"
