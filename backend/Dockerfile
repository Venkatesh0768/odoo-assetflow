# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# Install only production dependencies in a clean layer.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first so Docker cache is reused unless they change
COPY package.json package-lock.json ./

# Install production-only deps (no devDependencies in the final image)
RUN npm ci --omit=dev --ignore-scripts


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — final
# Copy source and deps into a minimal Alpine image.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS final

# dumb-init gives us a proper PID-1 that forwards signals to Node
RUN apk add --no-cache dumb-init

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Create logs directory (Winston writes files here in production)
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

# The backend listens on this port (configurable via PORT env var)
EXPOSE 5000

# Healthcheck — the Express app must respond on /api/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# dumb-init ensures clean signal handling (SIGTERM → graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
