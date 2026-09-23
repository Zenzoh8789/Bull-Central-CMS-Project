FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/content/package.json apps/content/package.json
RUN npm ci
COPY apps/content apps/content
COPY apps/api apps/api
COPY infra infra
RUN npm run build -w apps/api && mkdir -p /app/uploads && chown node:node /app/uploads
ENV NODE_ENV=production
ENV MEDIA_DIR=/app/uploads
EXPOSE 3000
USER node
CMD ["sh", "-c", "node infra/scripts/migrate.cjs && node infra/scripts/bootstrap-cms.cjs && node apps/api/dist/main.js"]
