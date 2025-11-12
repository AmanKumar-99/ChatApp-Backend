# Dockerfile - Node + TypeScript backend (builds TS and runs the compiled JS)
# Assumes your build produces dist/app.js as entry.

# Use official Node image
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# Install dependencies (non-dev) in production stage later, but install build deps first
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source and build
FROM deps AS builder
COPY . .
# If you use a separate tsconfig file, ensure tsconfig is available.
RUN npm run build

# Production image: copy compiled output only to reduce size
FROM node:18-alpine AS prod
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy package.json and production deps
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist
# Copy any needed resources (views, public etc.)
# COPY --from=builder /usr/src/app/public ./public

# Expose port (Render expects you to listen on this port)
ENV PORT=10000
EXPOSE 10000

# Start the server (adjust path if your compiled entry is different)
CMD ["node", "dist/app.js"]
