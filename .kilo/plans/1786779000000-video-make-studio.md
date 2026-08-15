# Plan: Video Make Studio

## Goal
Add a new **Video Make Studio** page that automates the workflow: upload 3–30 images → batch-convert each to video via Replicate → review/retry clips → stitch into a final video. Guided wizard. No changes to existing pages.

## Decisions
- **Page**: New `/video-make-studio` route with sidebar navigation entry.
- **Wizard steps**: Format → Images & Prompt → Calling Card → Generate → Review Clips → Transition → Finish.
- **Batch processing**: Sequential server-side generation (one Replicate prediction at a time) to avoid rate-limit issues.
- **Prompt/duration**: Single prompt + single duration applies to all images in the batch.
- **Credits**: Reserve total upfront (images × per-video cost). Refund individual clips that fail. Reserve 1 credit for final stitch (`video_editor_simple`).
- **Error handling**: Failed clips are marked in Review step; user can retry individually. Stitch proceeds with successful clips only.
- **Output**: Final video is stitched via FFmpeg WASM (reuse existing video-editor logic), offered as download, and saved to the user’s media library (`media_items` + `uploads` bucket).
- **Data tracking**: First code to write to the currently-unused `projects` and `ai_jobs` tables. Use a `batch_id` to group clip projects.

## Wizard Step Details

### 1. Format
- Choose output aspect ratio: vertical (720×1280), square (720×720), landscape (1280×720).
- Reuse options from existing `VideoEditorWizard`.

### 2. Images & Prompt
- Upload 3–30 images (drag/drop + click). Validate min 3, max 30.
- Single prompt textarea. Include “Auto Video Maker” quick-fill that inserts the strict “use only what’s in the photo” prompt.
- Duration dropdown: 3 / 5 / 10 / 15 seconds.
- Quality tier: Standard or Pro (same cost mapping as existing image-to-video).

### 3. Calling Card
- Optional branding overlay (agent name, headline, price, beds/baths, CTA, color).
- Reuse the calling-card UI and canvas-generation logic from `VideoEditorWizard`.

### 4. Generate
- Show progress bar and per-image status (pending → processing → completed / failed).
- Server processes images sequentially.
- Credits reserved upfront before generation starts.
- If a clip fails, its credits are refunded immediately and status is marked failed.

### 5. Review Clips
- Grid/list of generated video clips with thumbnails.
- Actions per clip: preview, play, retry (failed only), remove.
- Reorder clips with up/down buttons (drag-and-drop is out of scope for v1).
- Minimum 1 successful clip required to proceed.
- “Regenerate All” button to restart batch with same settings.

### 6. Transition
- Fade duration: 0.3s fast / 0.5s smooth / 0.8s soft.
- Mute audio toggle.
- Reuse transition UI from `VideoEditorWizard`.

### 7. Finish
- Stitch all successful clips using FFmpeg WASM with selected transition.
- Reserve 1 credit (`video_editor_simple`) for stitching.
- Final video preview with download button.
- Auto-save to `media_items` + `uploads/videos/` bucket.
- Show credit summary (spent on generation + stitch).

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/video-make-studio/page.tsx` | New page entry point |
| `src/app/video-make-studio/layout.tsx` | Auth + sidebar wrapper |
| `src/components/video/VideoMakeStudioWizard.tsx` | Main wizard component |
| `src/app/api/ai/video-make-studio/batch/route.ts` | `POST` to start batch, reserves credits, creates projects, fires sequential Replicate predictions |
| `src/app/api/ai/video-make-studio/batch/[batchId]/route.ts` | `GET` status endpoint for client polling |
| `src/app/api/ai/video-make-studio/webhook/route.ts` | `POST` Replicate webhook handler to update clip status asynchronously |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Add “Video Make Studio” nav item |
| `src/components/video/videoEditorHelpers.ts` | Extract reusable FFmpeg stitch/transition logic from `VideoEditorWizard` so the studio can reuse it without copy-pasting |
| `src/app/api/ai/image-to-video/route.ts` | Optionally extract the core Replicate prediction logic into a shared helper so both the existing page and the studio can call it (not strictly required, but reduces duplication) |

## Data Model Additions

No schema migration required — reuse existing tables:

- **`projects`**: Create one record per clip (`type: 'video'`, `status` tracks progress) and one for the final stitched video. Add `batch_id` text field to group clips.
- **`ai_jobs`**: Create one record per Replicate prediction (service: `replicate`, model per tier/mode).
- **`credit_transactions`**: Reserve/refund as usual.
- **`media_items`**: Save final video URL after stitching.

## Credit Cost Summary

| Action | Cost | Notes |
|--------|------|-------|
| Image → Video (3s) | 5 | Standard tier |
| Image → Video (5s) | 9 | |
| Image → Video (10s) | 17 | |
| Image → Video (15s) | 25 | |
| Pro tier multiplier | ×1.7 | Same as existing image-to-video |
| Stitch + transitions | 1 | `video_editor_simple` |
| Calling card overlay | 0 | Client-side canvas, no extra credit |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Replicate rate limits on sequential batch | Add 1–2s delay between predictions; expose retry with backoff |
| FFmpeg WASM memory crash with many/long clips | Enforce max 5s per clip (already done in video editor); limit batch to 30 images |
| Long generation time frustrates users | Show per-clip progress, allow retry of failed clips, let user leave and return (store batch state in DB) |
| Webhook reliability | If webhook fails, client polling serves as fallback |
| Credit refund edge cases | Use existing idempotent `refundCredits` logic keyed on `reference_id` |

## Validation Plan

1. Navigate to Video Make Studio from sidebar.
2. Upload 3 images, enter prompt, select 5s Pro, vertical format.
3. Confirm credit reservation matches `3 × 9 = 27`.
4. Watch sequential generation progress; confirm one clip fails → refund appears.
5. Retry failed clip; confirm new credit reservation and successful generation.
6. Proceed to Review, reorder clips, select 0.5s fade.
7. Finish → confirm 1 credit deducted for stitch.
8. Download final video and verify it appears in media library.
9. Confirm admin usage history shows individual clip generations + final stitch.
10. Verify existing `/image-to-video` and `/video-editor` pages are unchanged.

## Out of Scope
- Drag-and-drop reordering (use up/down buttons).
- Real-time websocket updates (use HTTP polling).
- Saving/loading studio presets.
- Changing existing pages or APIs.
- Support for >30 images per batch.
