FROM node:20-bullseye-slim
WORKDIR /app

# Copy backend package files for caching
COPY backend/package*.json ./

# Install production deps
RUN npm ci --omit=dev

# Copy backend source
COPY backend ./

# Set production env
ENV NODE_ENV=production

# Expose dynamic port
EXPOSE $PORT

# Start with diagnostic output
CMD ["sh", "-c", "echo 'Container starting with PORT=$PORT' && npm start"] 