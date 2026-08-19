# Video Maker Studio Timeout & Reliability Review

## Current State Assessment

### Server-side (Vercel) — SAFE
The batch API architecture is already correct for Vercel limits:
- `/batch/[batchId]` uses `checkReplicatePrediction()` — single Replicate API call per request
- Each poll request completes in <1s (DB query + 1 HTTP call to Replicate)
- Client polls every 3s; sequential clip processing happens asynchronously on Replicate
- 10 clips × ~30s generation = 5 min total, 20 clips = 10 min total — **no Vercel timeout risk**

### Client-side (Browser) — AT RISK
The real bottleneck is browser-based FFmpeg via `@ffmpeg/ffmpeg` (WASM):
- `handleExport()` runs entirely client-side
- 10–20 clips × 5s each = 50–100s video, heavy transcoding
- Memory: 20 × ~2MB video blobs = 40–80MB in browser RAM
- Transitions + music mixing + calling card overlay = complex filter graph
- **Risk**: browser tab crash, OOM killer, or >5 min freeze with no recovery

### Batch Recovery — INCOMPLETE
- Landing page shows batch list and "Resume" button
- "Resume" jumps to `generate` step but doesn't restore polling state
- If user refreshes during generation, `isGenerating` resets to `false`, polling stops
- No way to see in-progress batch from another device/tab

### Credit Safety — PARTIAL
- Credits reserved upfront for all clips
- Per-clip refund on failure
- **Missing**: batch-level timeout; if Replicate hangs forever, credits are stuck indefinitely

---

## Plan

### 1. Add batch-level safety timeout (server-side)
**File**: `src/app/api/ai/video-make-studio/batch/[batchId]/route.ts`

Add a `stuck_since` timestamp when a clip enters `processing`. In the batch status handler, if a clip has been `processing` for >10 minutes, mark it `failed` and refund credits. This prevents credits from being locked forever.

### 2. Add batch progress recovery (client-side)
**File**: `src/components/video/VideoMakeStudioWizard.tsx`

- Store `batchId` and `isGenerating` in `localStorage`
- On mount, if `batchId` exists in storage and batch is still `processing`, auto-resume polling
- "Resume" button on landing page should properly restore the generate step with active polling

### 3. Split FFmpeg export into chunks (client-side)
**File**: `src/components/video/videoEditorHelpers.ts`

For 10–20 clips, run FFmpeg in 2 phases:
- Phase 1: Normalize all clips individually (fast, low memory)
- Phase 2: Stitch normalized clips with transitions (uses less memory than raw files)
- Add memory monitoring and abort if >80% of available JS heap

### 4. Add export progress persistence
**File**: `src/components/video/VideoMakeStudioWizard.tsx`

- Save export progress to `sessionStorage` every 5%
- On refresh during export, show "Resuming export..." and continue from last checkpoint
- If browser tab was closed, offer to restart export from completed clips

### 5. Show estimated time remaining
**File**: `src/components/video/VideoMakeStudioWizard.tsx`

- Display "Estimated time remaining: ~X min" based on completed/total clips
- Helps user decide whether to keep tab open

---

## Validation Steps

1. Start batch with 10 clips, verify each API request <2s
2. Close browser tab during generation, reopen, verify polling resumes
3. Start export with 10 clips, verify memory stays <500MB in Chrome DevTools
4. Simulate stuck clip (mock `processing` >10min), verify auto-failure + refund
5. Test 20-clip batch end-to-end on Vercel preview deployment

---

## Open Questions

- Should we cap max clips at 10 on Hobby, 20 on Pro? Or keep 30 max?
- Do you want server-side FFmpeg fallback if browser runs out of memory? (requires Vercel Pro + longer timeout)
- Should we add push notifications when batch completes?
