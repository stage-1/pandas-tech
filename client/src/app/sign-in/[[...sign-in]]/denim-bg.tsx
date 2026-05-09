'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'

const DEV = process.env.NODE_ENV === 'development'
const log = (...args: unknown[]) => { if (DEV) console.log('[denim-bg]', ...args) }

const PALETTE = [0x3a5f9e, 0x2e4a8a, 0x5c82c8, 0x1a2f5e, 0x4a6fb5]

/** Three subtly different charcoals for blocky cubes (random index 1–3 → tones in this array). */
const CUBE_CHARCOAL = [0x2c2c2c, 0x353433, 0x3d3d3d]

// ─── Blocky scene ────────────────────────────────────────────────────────────

function useBlockyScene(canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!canvas) return
    log('initializing blocky scene')

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 14

    scene.add(new THREE.AmbientLight(0x777777, 0.88))
    const dir = new THREE.DirectionalLight(0xdedad6, 2.05)
    dir.position.set(6, 8, 4)
    scene.add(dir)

    type CubeMeta = { mesh: THREE.Mesh; rx: number; ry: number; rz: number }
    const cubes: CubeMeta[] = []
    const group = new THREE.Group()
    scene.add(group)

    for (let i = 0; i < 30; i++) {
      const size = 0.4 + Math.random() * 0.8
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({
          color: CUBE_CHARCOAL[Math.floor(Math.random() * CUBE_CHARCOAL.length)],
          flatShading: true,
        }),
      )
      mesh.position.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      group.add(mesh)
      cubes.push({ mesh, rx: (Math.random() - 0.5) * 0.004, ry: (Math.random() - 0.5) * 0.004, rz: (Math.random() - 0.5) * 0.002 })
    }

    log('spawned 30 cubes')
    let frame = 0
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++
      for (const { mesh, rx, ry, rz } of cubes) {
        mesh.rotation.x += rx
        mesh.rotation.y += ry
        mesh.rotation.z += rz
      }
      group.position.y = Math.sin(frame * 0.0008) * 0.6
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
      log('disposing blocky scene')
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      for (const { mesh } of cubes) {
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
    }
  }, [canvas])
}

// ─── Flowy scene ─────────────────────────────────────────────────────────────

function useFlowyScene(canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    if (!canvas) return
    log('initializing flowy scene')

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120)
    camera.position.z = 16

    scene.add(new THREE.AmbientLight(0x2a4070, 1.4))

    const pointLight = new THREE.PointLight(0x5c82c8, 3.5, 40)
    scene.add(pointLight)

    type Meta = { mesh: THREE.Mesh; ax: number; ay: number; az: number; phase: number }
    const meshes: Meta[] = []

    const makeMat = (i: number) => new THREE.MeshStandardMaterial({
      color: PALETTE[i % PALETTE.length],
      emissive: PALETTE[(i + 2) % PALETTE.length],
      emissiveIntensity: 0.18,
      roughness: 0.6,
      metalness: 0.2,
    })

    // 22 tori — varied radii and tube thickness
    for (let i = 0; i < 22; i++) {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.6 + Math.random() * 0.9, 0.06 + Math.random() * 0.14, 16, 64),
        makeMat(Math.floor(Math.random() * PALETTE.length)),
      )
      mesh.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 12)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      scene.add(mesh)
      meshes.push({ mesh, ax: (Math.random() - 0.5) * 0.003, ay: (Math.random() - 0.5) * 0.005, az: (Math.random() - 0.5) * 0.002, phase: Math.random() * Math.PI * 2 })
    }

    // 8 torus knots — flowing ribbon shapes
    const knotParams: [number, number][] = [[2,3],[3,2],[2,5],[3,4],[2,7],[5,3],[3,5],[4,7]]
    for (let i = 0; i < 8; i++) {
      const [p, q] = knotParams[i]
      const mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.5 + Math.random() * 0.4, 0.05 + Math.random() * 0.08, 128, 12, p, q),
        makeMat(Math.floor(Math.random() * PALETTE.length)),
      )
      mesh.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 12)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      scene.add(mesh)
      meshes.push({ mesh, ax: (Math.random() - 0.5) * 0.002, ay: (Math.random() - 0.5) * 0.004, az: (Math.random() - 0.5) * 0.003, phase: Math.random() * Math.PI * 2 })
    }

    log('spawned 22 tori + 8 torus knots')
    let frame = 0
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++
      const t = frame * 0.008
      pointLight.position.set(Math.sin(t * 0.4) * 10, Math.cos(t * 0.25) * 6, Math.sin(t * 0.6) * 8)
      for (const { mesh, ax, ay, az, phase } of meshes) {
        mesh.rotation.x += ax
        mesh.rotation.y += ay
        mesh.rotation.z += az
        mesh.position.y += Math.sin(t + phase) * 0.0008
      }
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
      log('disposing flowy scene')
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      for (const { mesh } of meshes) {
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
    }
  }, [canvas])
}

// ─── Component ───────────────────────────────────────────────────────────────

export type DenimScene = 'blocky' | 'flowy'

/**
 * Full-screen Three.js background canvas.
 * Default scene is 'blocky'. Switch to 'flowy' via the scene prop.
 *
 * Usage:
 *   <DenimBg />               ← blocky (default)
 *   <DenimBg scene="flowy" /> ← flowy tori + knots
 */
export function DenimBg({ scene = 'blocky' }: { scene?: DenimScene }) {
  // Callback ref → state: ensures the effect fires after the canvas mounts
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useBlockyScene(scene === 'blocky' ? canvas : null)
  useFlowyScene(scene === 'flowy' ? canvas : null)

  return (
    <canvas
      ref={setCanvas}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.5, zIndex: 1 }}
    />
  )
}
