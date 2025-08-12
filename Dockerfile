# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package.json and lock files first to leverage Docker cache
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the entire application code (including prisma schema)
COPY . .

# Generate Prisma client BEFORE building
RUN npx prisma generate

# Build the Next.js application for production
RUN npm run build

# Stage 2: Run the production application
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# Set Node.js environment to production
ENV NODE_ENV=production
ENV PORT=3003

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy environment files if they exist
COPY --from=builder /app/.env.production* ./

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose the port
EXPOSE 3003

# Command to run the application
CMD ["node", "server.js"]