# VMS FFmpeg Worker

Server-side FFmpeg video stitching worker for Video Maker Studio.

## Quick Start

1. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. Generate a secure API key:
   ```bash
   openssl rand -hex 32
   ```
   Paste the result as `WORKER_API_KEY` in your `.env` file.

3. Install dependencies:
   ```bash
   bun install
   ```

4. Build and run:
   ```bash
   npm run build
   npm start
   ```

## Docker Deployment

```bash
docker build -t vms-worker .
docker run -d --name vms-worker --env-file .env -p 8080:8080 --restart unless-stopped vms-worker
```

## API Endpoints

### GET /health

Health check. Returns `{ status: "ok", ffmpeg: true }` if FFmpeg is available.

### POST /stitch

Stitch clips into a final video.

Headers:
- `x-api-key`: Your WORKER_API_KEY
- `Content-Type: application/json`

Body:
```json
{
  "format": { "width": 720, "height": 1280 },
  "clips": [
    { "url": "https://.../clip1.mp4", "trimmedDuration": 5 },
    { "url": "https://.../clip2.mp4", "trimmedDuration": 5 }
  ],
  "transitionDuration": 0.5,
  "muteAudio": true,
  "callingCardUrl": "https://.../card.png",
  "musicUrl": "https://.../music.mp3",
  "endFrameUrl": "https://.../endframe.png",
  "userId": "user-uuid"
}
```

Response:
```json
{
  "outputUrl": "https://.../ai-outputs/stitched/user-uuid/1234567890.mp4"
}
```

## Droplet Setup

Run the setup script on a fresh Ubuntu droplet:

```bash
sudo bash scripts/setup.sh
```

Then deploy the worker:

```bash
cd /opt/vms-worker
docker build -t vms-worker .
docker run -d --name vms-worker --env-file .env -p 8080:8080 --restart unless-stopped vms-worker
```

## Vercel Environment Variables

Add these to your Vercel project:

- `WORKER_URL` — e.g., `http://164.90.xxx.xxx:8080`
- `WORKER_API_KEY` — same key as in worker .env
