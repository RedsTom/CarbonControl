  GNU nano 8.1                                              Dockerfile
# ========================================
# 1. Base image
# ========================================
FROM node:25-alpine AS base

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for caching)
COPY package*.json ./

# ========================================
# 2. Install dependencies
# ========================================
FROM base AS deps

# Install dependencies
RUN npm install

# ========================================
# 3. Build stage
# ========================================
FROM deps AS build

# Copy the rest of the app
COPY . .

# Build the project
RUN npm run build

# ========================================
# 4. Final runtime image
# ========================================
FROM node:25-alpine AS runtime

WORKDIR /usr/src/app

# Copy built output & production deps
COPY --from=build /usr/src/app ./
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Environment variables
#ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

# Default command
CMD ["npm", "run", "start"]