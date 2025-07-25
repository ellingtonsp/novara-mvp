#!/bin/bash
# Stub wrapper – relocated to scripts/deploy/deploy-with-validation.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/deploy/deploy-with-validation.sh" "$@" 