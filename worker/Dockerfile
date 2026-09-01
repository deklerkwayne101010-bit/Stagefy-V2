FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
