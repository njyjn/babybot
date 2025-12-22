# Use Alpine for smaller image
FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["/app/start.sh"]