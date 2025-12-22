# Use the official Node.js image (Debian-based for better sqlite3 support)
FROM node:25-slim

# Set the working directory
WORKDIR /app

# Allow DATABASE_URL to be provided at build time (defaults to local sqlite file)
ARG DATABASE_URL=file:./data/babybot.db
ENV DATABASE_URL=${DATABASE_URL}

# Install build dependencies for sqlite3 and native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client (migrations will run at startup)
RUN npm run prisma:generate

# Build the Next.js application
RUN npm run build

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Start the Next.js application with configurable port
CMD ["/app/start.sh"]