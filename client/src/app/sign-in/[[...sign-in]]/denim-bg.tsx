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

    const positions = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)

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
      velocities[i3]     = (Math.random() - 0.5) * 0.0008
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.0008
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.0002
      const [r, g, b] = paletteRGB[Math.floor(Math.random() * paletteRGB.length)]
      colors[i3] = r; colors[i3 + 1] = g; colors[i3 + 2] = b
    }

    const geometry = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(positions, 3)
    posAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute('position', posAttr)
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.16,
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

        velocities[i3]     += Math.sin(y * 0.4 + t * 0.6) * Math.cos(z * 0.3) * 0.0008
        velocities[i3 + 1] += Math.sin(z * 0.3 + t * 0.4) * Math.cos(x * 0.25) * 0.0006
        velocities[i3 + 2] += Math.cos(x * 0.25 + t * 0.5) * Math.sin(y * 0.35) * 0.0004

        velocities[i3]     *= 0.98
        velocities[i3 + 1] *= 0.98
        velocities[i3 + 2] *= 0.98

        positions[i3]     += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]

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

// ─── Component ───────────────────────────────────────────────────────────────

export type DenimScene = 'blocky' | 'flowy' | 'particle'

export function DenimBg({ scene = 'blocky' }: { scene?: DenimScene }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useBlockyScene(scene === 'blocky' ? canvas : null)
  useFlowyScene(scene === 'flowy' ? canvas : null)
  useParticleScene(scene === 'particle' ? canvas : null)

  return (
    <canvas
      ref={setCanvas}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.5, zIndex: 1 }}
    />
  )
}
