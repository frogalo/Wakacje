# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and lock files first to leverage Docker cache
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the entire application code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Stage 2: Run the production application
FROM node:20-alpine AS runner

WORKDIR /app

# Set Node.js environment to production
ENV NODE_ENV production
ENV PORT 3003

# Copy essential files for production runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Copy .env.production only if it exists (optional)
COPY --from=builder /app/.env.production* ./

# Expose the port
EXPOSE 3003

# Command to run the application
CMD ["npm", "start"]