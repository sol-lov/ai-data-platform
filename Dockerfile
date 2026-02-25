# -----------------------------
# Install dependencies
# -----------------------------
    FROM node:18-bullseye AS deps
    WORKDIR /app
    ENV NODE_ENV=production
    
    COPY package.json package-lock.json* ./
    RUN npm ci --include=dev --no-audit --no-fund
    
    
    # -----------------------------
    # Build stage
    # -----------------------------
    FROM node:18-bullseye AS builder
    WORKDIR /app
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # Build-time public envs
    ARG NEXT_PUBLIC_BACKEND_HTTP_BASE
    ARG NEXT_PUBLIC_BACKEND_WS_BASE
    ENV NEXT_PUBLIC_BACKEND_HTTP_BASE=${NEXT_PUBLIC_BACKEND_HTTP_BASE}
    ENV NEXT_PUBLIC_BACKEND_WS_BASE=${NEXT_PUBLIC_BACKEND_WS_BASE}
    
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # Prisma
    RUN npx prisma db push --force-reset
    RUN npx prisma generate
    
    # Next.js build (src/ is auto-detected)
    RUN npm run build
    
    
    # -----------------------------
    # Runner stage
    # -----------------------------
    FROM node:18-bullseye AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    ENV PORT=3000
    ENV HOSTNAME=0.0.0.0
    
    # Copy only what is needed for runtime
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/prisma ./prisma
    
    # Next.js standalone output (includes server.js)
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    
    EXPOSE 3000
    EXPOSE 5555
    
    CMD ["node", "server.js"]
    