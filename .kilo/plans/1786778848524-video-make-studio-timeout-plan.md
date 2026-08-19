# Video Maker Studio Timeout & Reliability Plan (Vercel Free)

## Context
- Vercel Free: 60s server timeout, no server-side FFmpeg
- Browser-side FFmpeg (WASM) can crash on 10–20 clips
- Batch processing is already safe: fast polls, sequential Replicate

## Tasks

### 1. Server-side stuck-clip timeout
**File**: `src/app/api/ai/video-make-studio/batch/[batchId]/route.ts`
- Add `STUCK_CLIP_TIMEOUT_MS = 10 * 60 * 1000`
- When clip enters `processing`, store `stuck_since` timestamp in `input_data`
- On each poll, if clip `processing` >10min, mark `failed`, refund credits, clear `stuck_since`
- Clear `stuck_since` on `completed`, `failed`, `canceled`

### 2. Client-side batch recovery
**File**: `src/components/video/VideoMakeStudioWizard.tsx`
- Store `batchId` + `isGenerating` in `localStorage` when generation starts
- On mount: if stored state exists, fetch batch status and auto-resume polling if still `processing`
- Clear storage on completion/failure
- Fix Resume button: set `isGenerating=true` and call `pollBatchStatus()`

### 3. Chunked FFmpeg export
**File**: `src/components/video/videoEditorHelpers.ts`
- Accept `signal?: AbortSignal` in `stitchVideoWithFFmpeg`
- Phase 1: normalize each clip individually to FFmpeg FS
- Phase 2: stitch normalized clips with transitions/music
- Check `signal.aborted` between phases
- Progress: 0–50% for normalize, 50–100% for stitch

### 4. Export progress persistence
**File**: `src/components/video/VideoMakeStudioWizard.tsx`
- Save export phase + clip index to `sessionStorage` every 5%
- On mount, if incomplete export exists, show "Resuming..." and continue
- Clear `sessionStorage` on completion/failure

### 5. Time-remaining estimate
**File**: `src/components/video/VideoMakeStudioWizard.tsx`
- During generation: show `~X min` based on `(total - completed) * 0.5`
- During export: show current phase log

## Validation
1. 10-clip batch: verify API requests <1s
2. Close tab during generation, reopen: verify auto-resume
3. 10-clip export: verify memory <500MB in DevTools
4. Stuck clip >10min: verify auto-fail + refund
5. Refresh during export: verify progress resumes
6. 20-clip batch end-to-end on Vercel preview

## Out of Scope
- No server-side FFmpeg fallback
- No push notifications
- Max clips stays 30
