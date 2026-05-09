# VIN Scanner Funny Comment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user uploads an image that clearly isn't a VIN (kitten, pizza, selfie, etc.), show a funny bilingual (Spanglish) comment about what they uploaded instead of a generic error.

**Architecture:** Extend the GPT-4o scan prompt to also detect obviously non-VIN content and return a `funnyComment` string. Add a `funny` phase to the scanner component that renders the image + the comment with a retry button.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zod, Vercel AI SDK (`generateObject`), OpenAI GPT-4o, shadcn/ui

---

### Task 1: Extend API schema and prompt

**Files:**
- Modify: `client/src/app/api/vin-scan/route.ts`

- [ ] **Step 1: Add `funnyComment` to the Zod result schema**

Replace the schema at lines 6–9 with:

```typescript
const resultSchema = z.object({
  vin: z.string(),
  confidence: z.number().min(0).max(1),
  funnyComment: z.string().optional(),
})
```

- [ ] **Step 2: Update the GPT-4o prompt to detect non-VIN images**

Replace the `text` content string (line 38) with:

```
Extract the Vehicle Identification Number (VIN) from this image. The VIN is a 17-character alphanumeric code found on the dashboard (visible through the windshield), driver-side door jamb sticker, or engine bay. Return ONLY uppercase letters and digits — no spaces, hyphens, or other characters. If you cannot find a VIN or are uncertain, set confidence below 0.5.

IMPORTANT: If the image clearly contains NO vehicle or VIN-related content at all (e.g. it's a pet, food, a selfie, a landscape, artwork, a meme, a screenshot, etc.), set confidence to 0, set vin to an empty string, and set funnyComment to a short, funny, self-aware bilingual (Spanish/English mix, Spanglish) comment about what the image actually shows. The comment should be warm and playful, like a friend teasing you. Examples of style (do NOT copy these verbatim — make a fresh one based on what you actually see):
- "Aw tan cute! Pero eso es un gatito, no un VIN 🐱"
- "Eso es una pizza... deliciosa pero sin número de serie 🍕"
- "Muy bonito el paisaje, pero los carros tienen VIN, no las montañas 🏔️"
- "Ese selfie quedó bien, pero necesitamos el VIN, no tu cara 😅"
If the image does contain a vehicle or possible VIN, leave funnyComment undefined.
```

- [ ] **Step 3: Verify the file compiles (TypeScript check)**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `vin-scan/route.ts`

- [ ] **Step 4: Commit**

```bash
git add client/src/app/api/vin-scan/route.ts
git commit -m "feat(vin-scan): detect non-VIN images and return funny bilingual comment"
```

---

### Task 2: Add `funny` phase to the scanner component

**Files:**
- Modify: `client/src/components/vehicles/vin-scanner.tsx`

- [ ] **Step 1: Add `funny` to the `Phase` union type**

Replace the `Phase` type definition (lines 18–24) with:

```typescript
type Phase =
  | { name: 'idle' }
  | { name: 'previewing'; file: File; previewUrl: string }
  | { name: 'scanning'; previewUrl: string }
  | { name: 'result'; vin: string; confidence: number; previewUrl: string }
  | { name: 'decoding'; vin: string; previewUrl: string }
  | { name: 'funny'; previewUrl: string; comment: string }
  | { name: 'error'; message: string }
```

- [ ] **Step 2: Update `revokePreview` to handle the `funny` phase**

Replace the `revokePreview` function (lines 38–42) with:

```typescript
function revokePreview(p: Phase) {
  if (p.name === 'previewing' || p.name === 'scanning' || p.name === 'result' || p.name === 'decoding' || p.name === 'funny') {
    URL.revokeObjectURL(p.previewUrl)
  }
}
```

- [ ] **Step 3: Handle `funnyComment` in `handleAnalyze`**

Replace the `const data = ...` and the block that follows it (lines 66–83) with:

```typescript
      const data = await res.json() as { vin: string; confidence: number; funnyComment?: string }
      const vin = data.vin.toUpperCase()
      const { confidence, funnyComment } = data

      console.log('[vin-scanner] scan result', { vin, confidence, funnyComment, threshold: CONFIDENCE_THRESHOLD })

      if (funnyComment) {
        setPhase({ name: 'funny', previewUrl, comment: funnyComment })
        return
      }

      if (confidence >= CONFIDENCE_THRESHOLD) {
        console.log('[vin-scanner] auto-confirming (high confidence), starting decode')
        await decodeAndConfirm(vin, previewUrl)
        return
      }

      console.log('[vin-scanner] showing result (low confidence)')
      setPhase({ name: 'result', vin, confidence, previewUrl })
    } catch (err) {
      console.error('[vin-scanner] scan error', err)
      setPhase({ name: 'error', message: 'No se pudo analizar la imagen. Intenta de nuevo.' })
    }
```

- [ ] **Step 4: Add `funny` phase UI (render block)**

After the `{/* result (low confidence only) */}` block (after line 255, before `{/* error */}`), add:

```tsx
        {/* funny — clearly not a VIN */}
        {phase.name === 'funny' && (
          <div className="flex flex-col gap-3">
            <img
              src={phase.previewUrl}
              alt="No es un VIN"
              className="w-full rounded-lg object-cover max-h-56"
            />
            <p className="text-sm text-center">{phase.comment}</p>
          </div>
        )}
```

- [ ] **Step 5: Add `funny` phase footer**

After the `{phase.name === 'result' && ...}` footer block (after line 274), add:

```tsx
        {phase.name === 'funny' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset} className="w-full">Reintentar</Button>
          </DialogFooter>
        )}
```

- [ ] **Step 6: Verify TypeScript compiles cleanly**

```bash
cd client && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add client/src/components/vehicles/vin-scanner.tsx
git commit -m "feat(vin-scanner): show funny bilingual comment when image is clearly not a VIN"
```
