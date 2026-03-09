FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3220
CMD ["npx", "tsx", "server/index.ts"]
