FROM node:20-slim

WORKDIR /app

COPY package*.json ./
# Install OS libs for Prisma and then install deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates libc6 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install

COPY . .

# Generate Prisma client first, then build TypeScript
RUN npm run prisma:generate && npm run build

# Remove devDependencies to slim the final image
RUN npm prune --omit=dev

EXPOSE ${PORT}

CMD ["node", "dist/index.js"]

