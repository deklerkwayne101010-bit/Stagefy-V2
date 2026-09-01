# DigitalOcean FFmpeg Worker — Implementation Plan

## Goal
Deploy a standalone FFmpeg worker on a DigitalOcean Droplet that handles video stitching for Video Maker Studio, replacing the browser-based WASM FFmpeg. The worker accepts clip URLs via HTTP, runs the same filter graph as the WASM version, uploads the result to Supabase Storage, and returns the public URL.

## Architecture

```
┌─────────────────┐     HTTP POST      ┌─────────────────────┐
│  Next.js App    │ ─────────────────► │  DO Droplet Worker  │
│  (Vercel)       │  clip URLs + opts  │  (Express + FFmpeg) │
│                 │ ◄───────────────── │                     │
│                 │  { outputUrl }     │  1. Download clips  │
└─────────────────┘                    │  2. Run FFmpeg      │
                                       │  3. Upload to Supa  │
                                       │  4. Return URL      │
                                       └─────────────────────┘
```

## Implementation Steps

### 1. Create Worker Service (`worker/`)

**Files to create:**
- `worker/package.json` — Dependencies: `express`, `@supabase/supabase-js`, `multer`, `cors`, `dotenv`
- `worker/src/index.ts` — Express server entry point
- `worker/src/stitch.ts` — FFmpeg command builder (ported from `videoEditorHelpers.ts:368-586`)
- `worker/src/ffmpeg.ts` — FFmpeg execution wrapper with progress parsing
- `worker/src/supabase.ts` — Supabase admin client + upload helper
- `worker/Dockerfile` — Multi-stage build with FFmpeg + Node.js 20
- `worker/.env.example` — Required environment variables

**Key implementation details:**

```typescript
// worker/src/stitch.ts — Port from src/components/video/video/editorHelpers.ts
export interface StitchJob {
  format: { width: number; height: number }
  clips: { url: string; trimmedDuration: number }[]
  transitionDuration: number
  muteAudio: boolean
  callingCardUrl?: string
  musicUrl?: string
  endFrameUrl?: string
}

export function buildFilterGraph(job: StitchJob): string {
  // Replicate exact logic from videoEditorHelpers.ts:475-545
  // - Per-clip normalization (trim, setpts, scale, crop, setsar, format)
  // - xfade transitions with offset calculation
  // - acrossfade audio crossfades
  // - Calling card overlay (overlay=x=0:y=H-h-24)
  // - Music aloop + amix
  // - End frame xfade
}
```

```typescript
// worker/src/ffmpeg.ts
export async function runFFmpeg(
  args: string[],
  onProgress?: (pct: number) => void
): Promise<void> {
  // Use child_process.spawn('/usr/bin/ffmpeg', args)
  // Parse stderr for progress (time=HH:MM:SS.ms)
  // 10-minute timeout via Promise.race
  // Throw with last 5 stderr lines + exit code on failure
}
```

### 2. HTTP API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Returns `{ status: 'ok', ffmpeg: true/false }` |
| `POST` | `/stitch` | Accepts `StitchJob` JSON, returns `{ outputUrl }` or `{ error }` |

**`/stitch` handler flow:**
1. Validate API key from `x-api-key` header against `WORKER_API_KEY`
2. Validate request body (clips array non-empty, format valid)
3. Download each clip to `/tmp/<jobId>/clip-N.mp4` (parallel with `Promise.all`)
4. Download calling card PNG, music MP3, end frame PNG if provided
5. Build filter graph via `buildFilterGraph()`
6. Execute FFmpeg with `runFFmpeg(args, onProgress)`
7. Upload `output.mp4` to Supabase `ai-outputs` bucket: `stitched/<userId>/<timestamp>.mp4`
8. Return `{ outputUrl: <publicUrl> }`
9. Clean up `/tmp/<jobId>/`

### 3. FFmpeg Build Args (replicate WASM)

```bash
ffmpeg \
  -i clip-0.mp4 -i clip-1.mp4 ... \
  -i calling-card.png \
  -i music.mp3 \
  -i endframe.png \
  -filter_complex "<buildFilterGraph()>" \
  -map "[vout]" -map "[outa]" \
  -c:v libx264 -preset ultrafast -crf 23 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -threads 0 \
  -y output.mp4
```

### 4. Environment Variables

```bash
# worker/.env
PORT=8080
WORKER_API_KEY=<random-32-char-secret>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
TEMP_DIR=/tmp
MAX_CLIPS=30
FFMPEG_TIMEOUT_MS=600000
```

### 5. Dockerfile

```dockerfile
FROM jrottenberg/ffmpeg:6.1-alpine AS ffmpeg
FROM node:20-alpine
COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg /usr/local/bin/ffprobe /usr/local/bin/ffprobe
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
EXPOSE 8080
CMD ["node", "src/index.js"]
```

### 6. Next.js Integration

**New file: `src/lib/video-make-studio/worker.ts`**

```typescript
const WORKER_URL = process.env.WORKER_URL
const WORKER_API_KEY = process.env.WORKER_API_KEY

export async function stitchOnWorker(
  job: StitchJob,
  userId: string
): Promise<string> {
  const res = await fetch(`${WORKER_URL}/stitch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': WORKER_API_KEY,
    },
    body: JSON.stringify({ ...job, userId }),
  })
  if (!res.ok) throw new Error(`Worker failed: ${await res.text()}`)
  const { outputUrl } = await res.json()
  return outputUrl
}
```

**Modify: `src/components/video/VideoMakeStudioWizard.tsx`**
- In `handleExport()` (line 460), replace `stitchVideoWithFFmpeg()` call with `stitchOnWorker()`
- Keep credit reservation logic unchanged
- Add fallback: if `WORKER_URL` is undefined, fall back to WASM

### 7. DigitalOcean Deployment

**Droplet setup:**
- Image: Ubuntu 24.04 LTS
- Size: Basic 2 GB / 1 CPU ($12/mo) — sufficient for 20–30 clips
- Region: Closest to Supabase instance (likely NYC/SFO)
- Enable monitoring

**Provisioning script (`worker/scripts/setup.sh`):**
```bash
#!/bin/bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
apt-get update && apt-get install -y ufw
ufw allow 22/tcp
ufw allow 8080/tcp
ufw enable
```

**Deploy workflow:**
1. Push code to GitHub
2. SSH into Droplet
3. `git clone` or `git pull`
4. `cd worker && docker build -t vms-worker .`
5. `docker run -d --name vms-worker --env-file .env -p 8080:8080 --restart unless-stopped vms-worker`

### 8. Vercel Environment Variables

Add to Vercel project settings:
- `WORKER_URL` = `http://<droplet-ip>:8080`
- `WORKER_API_KEY` = same secret as in worker `.env`

## Failure Modes

| Scenario | Handling |
|----------|----------|
| Worker unreachable | Fall back to WASM FFmpeg in browser |
| FFmpeg crashes | Return 500 with stderr lines; refund credits in Next.js |
| Clip download fails | Return 400 with which clips failed |
| Upload to Supabase fails | Retry once, then return 500 |
| Timeout (10 min) | Kill process, clean up temp files, return 504 |
| Invalid API key | Return 401 immediately |

## Validation Plan

1. **Local test:** Run worker locally with `docker run`, send test request with 3 sample clips
2. **Health check:** `curl http://localhost:8080/health` returns `{ status: 'ok", ffmpeg: true }`
3. **Integration test:** Trigger export in Video Make Studio with `WORKER_URL` set; verify result matches WASM output
4. **Load test:** Send 25-clip job; verify completes within 5 minutes
5. **Fallback test:** Unset `WORKER_URL`; verify WASM fallback works
6. **Monitoring:** Check DO dashboard for CPU/memory during job execution

## What You Need to Provide

Before implementation starts, share these values:

| Value | Purpose |
|-------|---------|
| Droplet public IP | Used in Vercel env var `WORKER_URL` and for SSH access |
| Supabase project URL | Worker needs this to upload finished videos |
| Supabase service role key | Worker authenticates to Supabase Storage |

## What You Need to Do on DigitalOcean

1. **Note the Droplet IP** — Find it in the DO control panel after creation
2. **Get Supabase credentials** — Project Settings → API in Supabase dashboard:
   - Project URL
   - Service role key (not the anon key)
3. **SSH into the droplet** — I'll provide a setup script to run once you're connected

That's it. I'll handle writing all the code, Dockerfile, and deployment commands.

## CORS Fix (Required for HTTPS)

The worker must allow cross-origin requests from Vercel. **Run this exact command on your droplet:**

```bash
cd /opt/vms-worker/worker && cat > src/index.ts << 'EOF'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { stitchHandler } from './stitch'
import { checkFFmpeg } from './ffmpeg'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '8080', 10)

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}))
app.options('*', cors())
app.use(express.json({ limit: '50mb' }))

app.get('/health', async (_req, res) => {
  const ffmpegOk = await checkFFmpeg()
  res.json({ status: 'ok', ffmpeg: ffmpegOk })
})

app.post('/stitch', stitchHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VMS FFmpeg Worker listening on port ${PORT}`)
})
EOF
```

**Then rebuild and restart:**
```bash
docker build -t vms-worker .
docker stop vms-worker
docker rm vms-worker
docker run -d --name vms-worker --env-file .env -p 8080:8080 --restart unless-stopped vms-worker
```

**Verify it's running:**
```bash
docker ps
curl http://localhost:8080/health
```

## Troubleshooting CORS Issues

If CORS errors persist after the fix:

**1. Verify the file was updated:**
```bash
cat /opt/vms-worker/worker/src/index.ts
```
Check that it contains `origin: '*'`.

**2. Check container logs:**
```bash
docker logs vms-worker
```

**3. Test CORS headers directly:**
```bash
curl -I -X OPTIONS http://localhost:8080/stitch \
  -H "Origin: https://stagefy.co.za" \
  -H "Access-Control-Request-Method: POST"
```
Look for `Access-Control-Allow-Origin: *` in the response.

**4. If headers are missing, rebuild completely:**
```bash
cd /opt/vms-worker/worker
docker build --no-cache -t vms-worker .
docker stop vms-worker
docker rm vms-worker
docker run -d --name vms-worker --env-file .env -p 8080:8080 --restart unless-stopped vms-worker
```

## Current Status

- Worker deployed and running on droplet `46.101.215.87`
- Docker container `vms-worker` is up and healthy
- CORS headers configured correctly (verified via curl)
- ngrok tunnel active: `https://senator-undecided-unvaried.ngrok-free.dev`
- Vercel env vars set: `NEXT_PUBLIC_WORKER_URL`, `NEXT_PUBLIC_WORKER_API_KEY`

## Remaining Issue

Browser still reports CORS error when calling ngrok URL. ngrok free tier may strip CORS headers.

## Next Steps

1. **Update Vercel env var** with current ngrok URL (if changed)
2. **Redeploy Vercel** after env var change
3. **Test export** in Video Maker Studio
4. **If CORS persists:** Switch to Cloudflare Tunnel (more reliable for CORS)

## Persistent CORS Issues

If CORS headers show correctly via curl but browser still blocks:

**1. ngrok may be stripping headers.** Test directly:
```bash
curl -I -X OPTIONS https://senator-undecided-unvaried.ngrok-free.dev/stitch \
  -H "Origin: https://stagefy.co.za" \
  -H "Access-Control-Request-Method: POST"
```

**2. If ngrok strips headers, try Cloudflare Tunnel instead:**
```bash
cloudflared tunnel --url http://localhost:8080
```

**3. Browser cache.** Hard refresh the Vercel app (Ctrl+Shift+R) or test in incognito mode.

**4. Verify Vercel env vars are set correctly:**
- `NEXT_PUBLIC_WORKER_URL` = full ngrok HTTPS URL
- `NEXT_PUBLIC_WORKER_API_KEY` = same key as in worker .env

**5. Redeploy Vercel after any env var change.**
