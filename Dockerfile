# ===========================================
# 🏗️ STAGE 1: Base builder image
# ===========================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install *all* dependencies including devDependencies (needed to compile TS)
RUN npm ci

# Copy all source files to the image
COPY . .

# Build the TypeScript project
RUN npm run build

# ===========================================
# 🧩 STAGE 2: Production image (small & clean)
# ===========================================
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Set environment to production
ENV NODE_ENV=production

# Copy package files again
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled JS output from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Optionally copy assets/public (if your server serves static files)
# COPY --from=builder /usr/src/app/public ./public

# Render or other platforms usually define $PORT automatically
ENV PORT=10000
EXPOSE 10000

# Run the compiled server
CMD ["node", "dist/app.js"]
