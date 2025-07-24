FROM node:20-bullseye-slim
WORKDIR /app

# Copy backend package files for caching
COPY backend/package*.json ./

# Clear npm cache and install production deps with retry logic
RUN npm cache clean --force && \
    npm ci --omit=dev --no-audit --no-fund --prefer-offline || \
    (sleep 5 && npm ci --omit=dev --no-audit --no-fund --prefer-offline) || \
    (sleep 10 && npm ci --omit=dev --no-audit --no-fund --prefer-offline)

# Copy backend source
COPY backend ./

# Set environment (will be overridden by Railway env vars)
ENV NODE_ENV=staging

# Expose dynamic port
EXPOSE $PORT

# Start with diagnostic output
CMD ["sh", "-c", "echo 'Container starting with PORT=$PORT' && npm start"] 