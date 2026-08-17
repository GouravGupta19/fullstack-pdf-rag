FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy dependencies first for caching
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy application code
COPY . .

# Expose API port
EXPOSE 8000

# We use a start script or Docker Compose command to decide whether to run 'index.js' (API) or 'worker.js' (Worker)
CMD ["node", "index.js"]
