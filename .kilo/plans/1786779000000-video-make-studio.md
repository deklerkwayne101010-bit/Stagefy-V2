# Plan: Video Make Studio

## Goal
New `/video-make-studio` page that turns 3–30 uploaded images into a stitched video. Guided wizard. Existing pages untouched.

## Fixed Decisions
- Wizard: Format → Images & Prompt → Calling Card → Generate → Review Clips → Transition → Finish
- Single prompt + duration applies to all images
- Sequential batch processing on server
- Credits: reserve total upfront, refund per failed clip, 1 credit for final stitch
- Reuse FFmpeg WASM stitching from existing video editor
- No schema migration; reuse `projects`, `credit_transactions`, `media_items`

## Phases

### Phase 1: Shell, Nav & Shared Helpers
**Goal:** Route exists and navigation works; shared FFmpeg stitch logic extracted.

Tasks:
- Create `src/app/video-make-studio/page.tsx` and `layout.tsx`
- Add sidebar nav item in `src/components/layout/Sidebar.tsx`
- Extract FFmpeg stitch/transition logic from `VideoEditorWizard` into `src/components/video/videoEditorHelpers.ts` as `stitchVideoWithFFmpeg(options)`

Exit criteria:
- `/video-make-studio` loads behind auth with sidebar
- Existing `/video-editor` and `/image-to-video` unchanged
- `stitchVideoWithFFmpeg` is callable with format, clips, transition, calling-card PNG

### Phase 2: Batch Backend
**Goal:** Server can start a batch, create project records, and process clips sequentially.

Files:
- `src/app/api/ai/video-make-studio/batch/route.ts` — `POST` validates input, reserves total credits, creates batch project + clip projects, starts first prediction
- `src/app/api/ai/video-make-studio/batch/[batchId]/route.ts` — `GET` returns batch status + clip list; processes next pending clip or polls current processing clip
- `src/app/api/ai/video-make-studio/webhook/route.ts` — `POST` Replicate webhook updates clip project status

Behavior:
- Sequential: only one Replicate prediction active at a time
- On failure: refund that clip’s credits, mark project `failed`
- On success: store output URL in project `output_data`, mark `completed`

Exit criteria:
- Batch API returns `batchId`, clip statuses, and summary counts
- Failed clips trigger credit refunds
- Admin can see `projects` rows created per batch

### Phase 3: Wizard Steps 1–3 (Setup)
**Goal:** User can configure format, upload images, and set calling card.

Tasks:
- Implement `VideoMakeStudioWizard.tsx` steps: `format`, `images`, `calling_card`
- Image upload: 3–30 images, store both data URLs and Supabase URLs
- Show total estimated cost = clips + stitch
- Auto Video Maker button fills prompt

Exit criteria:
- Wizard advances through first 3 steps
- Images preview in grid, removable
- Calling card preview mirrors existing video editor

### Phase 4: Wizard Steps 4–5 (Generate & Review)
**Goal:** Batch generation runs and user can review/retry clips.

Tasks:
- Implement `generate` step: progress bar, per-clip status cards, polling via `/batch/[batchId]`
- Implement `review` step: show successful clips in order, failed clips with retry button
- Retry resets clip to pending and re-triggers server processing

Exit criteria:
- Batch progresses from pending → processing → completed/failed
- Retry on failed clip works and reserves/refunds correctly
- User can proceed with any successful clips

### Phase 5: Wizard Steps 6–7 (Stitch & Finish)
**Goal:** User picks transition and gets final downloadable video.

Tasks:
- Implement `transition` step: fade duration + mute toggle
- Implement `finish` step: call `stitchVideoWithFFmpeg`, reserve 1 stitch credit, show preview
- Download + save to media library via `uploadImage`
- Credit summary display

Exit criteria:
- Final video plays in browser
- Download and save-to-library both work
- 1 credit deducted for stitch, refunded on failure

## Files to Create
| File | Phase |
|------|-------|
| `src/app/video-make-studio/page.tsx` | 1 |
| `src/app/video-make-studio/layout.tsx` | 1 |
| `src/components/video/VideoMakeStudioWizard.tsx` | 3–5 |
| `src/app/api/ai/video-make-studio/batch/route.ts` | 2 |
| `src/app/api/ai/video-make-studio/batch/[batchId]/route.ts` | 2 |
| `src/app/api/ai/video-make-studio/webhook/route.ts` | 2 |

## Files to Modify
| File | Phase | Change |
|------|-------|--------|
| `src/components/layout/Sidebar.tsx` | 1 | Add nav item |
| `src/components/video/videoEditorHelpers.ts` | 1 | Add `stitchVideoWithFFmpeg` |

## Credit Costs
| Action | Cost |
|--------|------|
| Image → Video (3s) Standard | 5 |
| Image → Video (5s) Standard | 5 |
| Image → Video (5s) Pro | 9 |
| Image → Video (10s) Pro | 17 |
| Image → Video (15s) Pro | 25 |
| Final stitch | 1 |

## Implementation Status

### Phase 1: Shell, Nav & Shared Helpers ✅
- Created `src/app/video-make-studio/page.tsx` and `layout.tsx`
- Added sidebar nav item in `src/components/layout/Sidebar.tsx`
- Extracted `stitchVideoWithFFmpeg(options)` into `src/components/video/videoEditorHelpers.ts`

### Phase 2: Batch Backend ✅
- Created `src/app/api/ai/video-make-studio/batch/route.ts` — POST starts batch, reserves credits, creates projects
- Created `src/app/api/ai/video-make-studio/batch/[batchId]/route.ts` — GET status + sequential processing
- Created `src/app/api/ai/video-make-studio/webhook/route.ts` — Replicate webhook handler
- Created `src/app/api/ai/video-make-studio/batch/[batchId]/retry/route.ts` — Retry failed clips
- Created `src/lib/video-make-studio/replicate.ts` — Shared Replicate helper

### Phase 3: Wizard Steps 1–3 (Setup) ✅
- Implemented `VideoMakeStudioWizard.tsx` with format, images, and calling_card steps
- Image upload 3–30 images with preview grid
- Duration, tier, prompt with Auto Video Maker
- Live cost estimation

### Phase 4: Wizard Steps 4–5 (Generate & Review) ✅
- Implemented generate step with progress bar and per-clip status
- Implemented review step with successful clips grid and failed clip retry
- Polling via `/batch/[batchId]` every 3 seconds
- Retry functionality with credit reservation

### Phase 5: Wizard Steps 6–7 (Stitch & Finish) ✅
- Implemented transition step with fade duration selector and mute toggle
- Implemented finish step with FFmpeg stitching, credit reservation, preview
- Download MP4 and Save to Media Library functionality
- Credit summary display

## Out of Scope
- Drag-and-drop reordering
- Websocket updates
- Presets
- Changing existing pages/APIs
- >30 images per batch
