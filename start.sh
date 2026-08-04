#!/bin/sh
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Starting GateCore Server..."
node dist/backend/index.js