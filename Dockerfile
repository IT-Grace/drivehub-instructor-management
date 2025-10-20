# Use Node.js LTS version
FROM node:18-alpine AS base

# Install dependencies for native modules and PostgreSQL client
RUN apk add --no-cache python3 make g++ postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage for building
FROM node:18-alpine AS build

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application
# First build the frontend with Vite, then build the backend with esbuild
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache postgresql-client

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S drivewise -u 1001

WORKDIR /app

# Copy package files and install production dependencies + vite for development imports
COPY package*.json ./
RUN npm ci --only=production && \
    npm install vite nanoid && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy shared schema (needed for runtime)
COPY --from=build /app/shared ./shared

# Copy vite config and vite module for development mode imports
COPY --from=build /app/vite.config.ts ./
COPY --from=build /app/server/vite.ts ./server/

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads && \
    chown -R drivewise:nodejs /app

# Switch to non-root user
USER drivewise

# Expose the port the app runs on
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["npm", "start"]