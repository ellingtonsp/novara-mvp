FROM node:20-bullseye-slim

# Install Python and build dependencies for node-gyp (required by some packages)
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copy backend package files for caching
COPY backend/package*.json ./

# Clear npm cache and install all deps (including better-sqlite3 which needs build tools)
# Note: better-sqlite3 is only used in local dev but is in prod dependencies
RUN npm cache clean --force && \
    npm ci --no-audit --no-fund || \
    (sleep 5 && npm ci --no-audit --no-fund) || \
    (sleep 10 && npm ci --no-audit --no-fund)

# Copy backend source
COPY backend/ ./

# Set environment (will be overridden by Railway env vars)
ENV NODE_ENV=staging

# Expose dynamic port
EXPOSE $PORT

# Start with diagnostic output
CMD ["sh", "-c", "echo 'Container starting with PORT=$PORT' && npm start"] 