# Particle Flow Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `'particle'` scene to `DenimBg` — sparse, fluidly flowing point particles — and make it the default for the sign-in page.

**Architecture:** Add a `useParticleScene` hook to `denim-bg.tsx` alongside the existing blocky/flowy hooks. The hook creates a `THREE.Points` object backed by a mutable `Float32Array`; each frame a sinusoidal flow field perturbs each particle's velocity and the position buffer is flushed to the GPU with `needsUpdate = true`. Particles wrap around the bounding box so the screen never goes empty. The `DenimScene` union type gains a `'particle'` variant.

**Tech Stack:** Three.js (`THREE.BufferGeometry`, `THREE.BufferAttribute`, `THREE.Points`, `THREE.PointsMaterial`), React hooks, Next.js dynamic import.

**Three.js API notes (from docs):**
- `geometry.setAttribute('position', new THREE.BufferAttribute(float32, 3))` — itemSize=3
- `PointsMaterial({ size, sizeAttenuation: true, transparent: true, vertexColors: true })`
- Per-vertex color: `geometry.setAttribute('color', new THREE.BufferAttribute(colorFloat32, 3))`
- `geometry.attributes.position.needsUpdate = true` — flushes the entire buffer; acceptable for ≤300 particles

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `client/src/app/sign-in/[[...sign-in]]/denim-bg.tsx` | Modify | Add `useParticleScene` hook + `'particle'` to `DenimScene` type |
| `client/src/app/sign-in/[[...sign-in]]/sign-in-client.tsx` | Modify | Change `scene="flowy"` → `scene="particle"` |

---

## Task 1: Add `useParticleScene` hook and update `DenimBg`

**Files:**
- Modify: `client/src/app/sign-in/[[...sign-in]]/denim-bg.tsx`

### Scene design

- **Count:** 200 particles
- **Bounds:** x ∈ [-14, 14], y ∈ [-9, 9], z ∈ [-6, 6]  (matches camera frustum at z=16, fov=60)
- **Flow field (per frame):**
  ```
  vx += sin(y * 0.4 + t * 0.6) * cos(z * 0.3) * 0.012
  vy += sin(z * 0.3 + t * 0.4) * cos(x * 0.25) * 0.008
  vz += cos(x * 0.25 + t * 0.5) * sin(y * 0.35) * 0.006
  ```
- **Drag:** multiply velocity by 0.96 each frame (keeps speed bounded)
- **Wrap:** if any axis exceeds bounds, reflect to opposite edge
- **Colour:** each particle picks randomly from `PALETTE`; stored in a `Float32Array` (colours 0–1)
- **Material:** `size: 2.5`, `sizeAttenuation: true`, `transparent: true`, `opacity: 0.75`, `vertexColors: true`

### Steps

- [ ] **Step 1: Add `'particle'` to the `DenimScene` type**

In `denim-bg.tsx`, change:
```ts
export type DenimScene = 'blocky' | 'flowy'
```
to:
```ts
export type DenimScene = 'blocky' | 'flowy' | 'particle'
```

- [ ] **Step 2: Wire `useParticleScene` into the component**

In the `DenimBg` component body, add after `useFlowyScene(...)`:
```ts
useParticleScene(scene === 'particle' ? canvas : null)
```

- [ ] **Step 3: Implement `useParticleScene` hook**

Add this block between the `// ─── Flowy scene ─────` section and `// ─── Component ───────` (around line 184):

```ts
// ─── Particle scene ──────────────────────────────────────────────────────────

function useParticleScene(canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!canvas) return
    log('initializing particle scene')

    const COUNT = 200
    const BOUNDS = { x: 14, y: 9, z: 6 }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120)
    camera.position.z = 16

    // Position and velocity buffers (CPU-side)
    const positions = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)

    // Palette colours as [r, g, b] in 0-1
    const paletteRGB: [number, number, number][] = [
      [0x3a / 255, 0x5f / 255, 0x9e / 255],
      [0x2e / 255, 0x4a / 255, 0x8a / 255],
      [0x5c / 255, 0x82 / 255, 0xc8 / 255],
      [0x1a / 255, 0x2f / 255, 0x5e / 255],
      [0x4a / 255, 0x6f / 255, 0xb5 / 255],
    ]

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      positions[i3]     = (Math.random() - 0.5) * BOUNDS.x * 2
      positions[i3 + 1] = (Math.random() - 0.5) * BOUNDS.y * 2
      positions[i3 + 2] = (Math.random() - 0.5) * BOUNDS.z * 2
      velocities[i3]     = (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01
      const [r, g, b] = paletteRGB[Math.floor(Math.random() * paletteRGB.length)]
      colors[i3] = r; colors[i3 + 1] = g; colors[i3 + 2] = b
    }

    const geometry = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(positions, 3)
    posAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('position', posAttr)
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 2.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
      vertexColors: true,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)
    log(`spawned ${COUNT} particles`)

    let frame = 0
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++
      const t = frame * 0.01

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        const x = positions[i3], y = positions[i3 + 1], z = positions[i3 + 2]

        // Flow field
        velocities[i3]     += Math.sin(y * 0.4 + t * 0.6) * Math.cos(z * 0.3) * 0.012
        velocities[i3 + 1] += Math.sin(z * 0.3 + t * 0.4) * Math.cos(x * 0.25) * 0.008
        velocities[i3 + 2] += Math.cos(x * 0.25 + t * 0.5) * Math.sin(y * 0.35) * 0.006

        // Drag
        velocities[i3]     *= 0.96
        velocities[i3 + 1] *= 0.96
        velocities[i3 + 2] *= 0.96

        // Integrate
        positions[i3]     += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]

        // Wrap
        if (positions[i3]     >  BOUNDS.x) positions[i3]     = -BOUNDS.x
        if (positions[i3]     < -BOUNDS.x) positions[i3]     =  BOUNDS.x
        if (positions[i3 + 1] >  BOUNDS.y) positions[i3 + 1] = -BOUNDS.y
        if (positions[i3 + 1] < -BOUNDS.y) positions[i3 + 1] =  BOUNDS.y
        if (positions[i3 + 2] >  BOUNDS.z) positions[i3 + 2] = -BOUNDS.z
        if (positions[i3 + 2] < -BOUNDS.z) positions[i3 + 2] =  BOUNDS.z
      }

      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      log('disposing particle scene')
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [canvas])
}
```

- [ ] **Step 4: Verify TypeScript compiles without new errors**

Run: `cd client && npx tsc --noEmit 2>&1 | grep "denim-bg\|sign-in-client"`
Expected: no output (no new errors in these files)

---

## Task 2: Switch sign-in to use the particle scene

**Files:**
- Modify: `client/src/app/sign-in/[[...sign-in]]/sign-in-client.tsx`

- [ ] **Step 1: Update the prop**

Change:
```tsx
<DenimBg scene="flowy" />
```
to:
```tsx
<DenimBg scene="particle" />
```

- [ ] **Step 2: Verify TypeScript still clean**

Run: `cd client && npx tsc --noEmit 2>&1 | grep "sign-in-client"`
Expected: no output

- [ ] **Step 3: Commit both files**

```bash
git add client/src/app/sign-in/\[\[...sign-in\]\]/denim-bg.tsx \
        client/src/app/sign-in/\[\[...sign-in\]\]/sign-in-client.tsx
git commit -m "feat: add particle flow scene and use it on sign-in"
```

---

## Self-Review

**Spec coverage:**
- ✅ Single-point particles — `THREE.Points` with `PointsMaterial`
- ✅ Flowing like a fluid — sinusoidal flow field drives velocity
- ✅ Sparse — 200 particles across a wide frustum
- ✅ Now the shown scene — sign-in-client updated

**Placeholder scan:** None found — all code is complete.

**Type consistency:** `DenimScene` union is extended in one place; `useParticleScene` signature matches the call site; `BOUNDS` object is used consistently in both init and wrap sections.
