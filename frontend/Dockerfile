# LeadFlow frontend — Next.js 16 (App Router) + Tailwind v4
# Build:  docker build -t leadflow-frontend ./frontend
# Run:    docker run --rm -p 3000:3000 --env-file .env.local leadflow-frontend

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build production bundle
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]