FROM jrottenberg/ffmpeg:6.1-alpine AS ffmpeg

FROM node:20-alpine

COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg /usr/local/bin/ffprobe /usr/local/bin/ffprobe

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]
