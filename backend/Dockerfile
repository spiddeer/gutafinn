FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY db.js seed.js server.js seed-data.json ./

ENV PORT=8080
ENV DB_PATH=/data/places.db
EXPOSE 8080

CMD ["sh", "-c", "node seed.js && node server.js"]
