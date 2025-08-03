# Multi-stage build for production
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --silent && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3008/health/check', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3008

# Start the application
CMD ["node", "dist/main.js"]