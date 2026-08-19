# Video Maker Studio Timeout & Reliability Fix Plan (Vercel Free)

## Context
- Vercel Free tier: 60s server timeout, no server-side FFmpeg possible
- Client-side FFmpeg (WASM) runs in browser, vulnerable to tab crash/OOM
- Batch processing already safe server-side (fast polls, sequential Replicate)

## Implementation Tasks (Ordered)

### 1. Add stuck-clip server-side timeout
**File**: `src/app/api/ai/video-make-studio/batch/[batchId]/route.ts`

Changes:
1. Add constant after imports:
   ```ts
   const STUCK_CLIP_TIMEOUT_MS = 10 * 60 * 1000
   ```

2. After building `clips` array and before normal processing, add stuck-clip check loop:
   ```ts
   for (const clip of processingClips) {
     const clipProject = (clipProjects || []).find((p: any) => p.id === clip.id)
     if (!clipProject) continue

     const input = clipProject.input_data || {}
     const stuckSince = input.stuck_since ? new Date(input.stuck_since).getTime() : null

     if (stuckSince && Date.now() - stuckSince > STUCK_CLIP_TIMEOUT_MS) {
       await (adminClient.from as any)('projects')
         .update({
           status: 'failed',
           error_message: 'Generation timed out after 10 minutes',
           input_data: { ...clipProject.input_data, stuck_since: null },
         })
         .eq('id', clipProject.id)

       await refundCredits(user.id, getImageToVideoOperation(input.duration || 5), `clip-timeout-${clipProject.id}`, clipProject.credit_cost)

       const failedClip = clips.find(c => c.id === clipProject.id)
       if (failedClip) {
         failedClip.status = 'failed'
         failedClip.error = 'Generation timed out after 10 minutes'
       }
     }
   }
   ```

3. Update `pending -> processing` transition to include `stuck_since`:
   ```ts
   input_data: { ...clipProject.input_data, prediction_id: predictionId, stuck_since: new Date().toISOString() },
   ```

4. On all status updates (`completed`, `failed`, `canceled`), clear `stuck_since`:
   ```ts
   input_data: { ...clipProject.input_data, stuck_since: null },
   ```

5. Update `hasFailed` calculation:
   ```ts
   const hasFailed = clips.some(c => c.status === 'failed')
   ```

### 2. Add batch progress recovery (client-side)
**File**: `src/components/video/VideoMakeStudioWizard.tsx`

Changes:
1. Add `useEffect` on mount to restore generation state:
   ```ts
   useEffect(() => {
     let cancelled = false
     async function restoreBatch() {
       try {
         const storedBatchId = localStorage.getItem('vms-batch-id')
         const storedIsGenerating = localStorage.getItem('vms-is-generating') === 'true'
         if (!storedBatchId || !storedIsGenerating || !user?.id) return

         const { supabase } = await import('@/lib/supabase')
         const { data: { session } } = await supabase.auth.getSession()
         const response = await fetch(`/api/ai/video-make-studio/batch/${storedBatchId}`, {
           headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
         })
         const data = await response.json()

         if (data.status === 'processing') {
           setBatchId(storedBatchId)
           setIsGenerating(true)
           setStep('generate')
           void pollBatchStatus()
         } else {
           localStorage.removeItem('vms-batch-id')
           localStorage.removeItem('vms-is-generating')
         }
       } catch {
         // silent
       }
     }
     void restoreBatch()
     return () => { cancelled = true }
   }, [user?.id])
   ```

2. Update `startBatch()` to persist state:
   ```ts
   localStorage.setItem('vms-batch-id', data.batchId)
   localStorage.setItem('vms-is-generating', 'true')
   ```

3. Update polling completion handler to clear storage:
   ```ts
   if (data.status === 'completed' || data.status === 'completed_with_errors') {
     localStorage.removeItem('vms-batch-id')
     localStorage.removeItem('vms-is-generating')
     setIsGenerating(false)
     ...
   }
   ```

4. Fix Resume button on landing page:
   ```tsx
   onClick={() => {
     setBatchId(batch.id)
     setResumingBatchId(batch.id)
     setIsGenerating(true)
     setStep('generate')
     void pollBatchStatus()
   }}
   ```

### 3. Chunk client-side FFmpeg export for memory safety
**File**: `src/components/video/videoEditorHelpers.ts`

Changes:
1. Update `stitchVideoWithFFmpeg` signature to accept `AbortSignal`:
   ```ts
   export async function stitchVideoWithFFmpeg(options: StitchOptions & { signal?: AbortSignal }): Promise<Blob>
   ```

2. Split into phases:
   - Phase 1: Write each clip to FFmpeg FS, normalize individually
   - Phase 2: Build filter_complex, run final stitch with transitions/music

3. Add signal checks:
   ```ts
   if (options.signal?.aborted) throw new Error('Export cancelled')
   ```

4. Progress callback should indicate phase:
   ```ts
   onProgress?.(phase === 'normalize' ? Math.round((index / clips.length) * 50) : 50 + Math.round((ffmpegProgress) * 50))
   ```

### 4. Add export progress persistence
**File**: `src/components/video/VideoMakeStudioWizard.tsx`

Changes:
1. In `handleExport`, save progress to sessionStorage:
   ```ts
   sessionStorage.setItem('vms-export-phase', 'normalize')
   sessionStorage.setItem('vms-export-clip-index', String(index))
   ```

2. On mount, check for incomplete export:
   ```ts
   const exportPhase = sessionStorage.getItem('vms-export-phase')
   if (exportPhase) {
     // Show "Resuming export..." prompt
   }
   ```

3. On completion/failure, clear sessionStorage:
   ```ts
   sessionStorage.removeItem('vms-export-phase')
   sessionStorage.removeItem('vms-export-clip-index')
   ```

### 5. Add time-remaining estimate to UI
**File**: `src/components/video/VideoMakeStudioWizard.tsx`

Changes:
1. Add estimate display in generate step:
   ```tsx
   {isGenerating && (
     <p className="text-sm text-slate-500">
       Estimated time remaining: ~{Math.max(1, Math.round((summary.total - summary.completed) * 0.5))} min
     </p>
   )}
   ```

2. Show phase progress during export:
   ```tsx
   {isExporting && logs.length > 0 && (
     <p className="text-xs text-slate-400">{logs[logs.length - 1]}</p>
   )}
   ```

## Validation Steps
1. Start 10-clip batch: verify each API request <1s, no Vercel timeout
2. Close browser tab during generation, reopen: verify polling auto-resumes
3. Start 10-clip export: verify memory stays <500MB in Chrome DevTools
4. Simulate stuck clip (mock `processing` >10min): verify auto-failure + credit refund
5. Refresh browser during export: verify progress resumes from checkpoint
6. Test 20-clip batch end-to-end on Vercel preview

## Out of Scope (no Vercel Pro)
- No server-side FFmpeg fallback
- No push notifications for batch completion
- Max clips remains 30 (users can split into multiple batches for very large jobs)
