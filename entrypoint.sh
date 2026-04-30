#!/bin/sh
set -e

echo "Generating Prisma client..."
bun run db:generate

echo "Deploying migrations..."
bun run db:deploy

echo "Starting server..."
exec bun run server.prod.ts
