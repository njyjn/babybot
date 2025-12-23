#!/bin/sh
set -e

# 1. Parse Options
CONFIG_PATH="/data/options.json"
if [ -f "$CONFIG_PATH" ]; then
    CFG_DB_URL=$(jq -r '.database_url // empty' $CONFIG_PATH)
    CFG_PORT=$(jq -r '.port // empty' $CONFIG_PATH)
    CFG_SLACK_WEBHOOK=$(jq -r '.slack_webhook_url // empty' $CONFIG_PATH)
fi

# 2. Prepare Database Path
DEFAULT_DB_DIR="/share"
DEFAULT_DB_FILE="$DEFAULT_DB_DIR/babybot.db"

if [ ! -d "$DEFAULT_DB_DIR" ]; then
    mkdir -p "$DEFAULT_DB_DIR"
fi

# 3. Set Environment Variables
if [ -n "$CFG_DB_URL" ]; then
    export DATABASE_URL="$CFG_DB_URL"
else
    export DATABASE_URL="file:$DEFAULT_DB_FILE"
fi

export PORT="${CFG_PORT:-3001}"

if [ -n "$CFG_SLACK_WEBHOOK" ]; then
    export SLACK_WEBHOOK_URL="$CFG_SLACK_WEBHOOK"
fi

# 4. Generate Prisma Client
cd /app
npm run prisma:generate

# 5. Run Migrations
echo "Running migrations..."
npm run prisma:migrate

# 6. Start App
echo "Starting application on port $PORT..."
exec npm start -- -p "$PORT"