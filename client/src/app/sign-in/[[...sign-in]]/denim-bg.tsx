'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const DEV = process.env.NODE_ENV === 'development'
const log = (...args: unknown[]) => { if (DEV) console.log('[denim-bg]', ...args) }

const PALETTE = [0x3a5f9e, 0x2e4a8a, 0x5c82c8, 0x1a2f5e, 0x4a6fb5]
const CUBE_COUNT = 30

export function DenimBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    log('initializing blocky scene')

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 14

    // Lighting
    const ambient = new THREE.AmbientLight(0x3a5f9e, 1.2)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0x7aaeff, 2.5)
    dirLight.position.set(6, 8, 4)
    scene.add(dirLight)

    // Cubes
    type CubeMeta = { mesh: THREE.Mesh; rx: number; ry: number; rz: number }
    const cubes: CubeMeta[] = []
    const group = new THREE.Group()
    scene.add(group)

    for (let i = 0; i < CUBE_COUNT; i++) {
      const size = 0.4 + Math.random() * 0.8
      const geo = new THREE.BoxGeometry(size, size, size)
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      const mat = new THREE.MeshStandardMaterial({ color, flatShading: true })
      const mesh = new THREE.Mesh(geo, mat)

      mesh.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10,
      )
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )

      group.add(mesh)
      cubes.push({
        mesh,
        rx: (Math.random() - 0.5) * 0.004,
        ry: (Math.random() - 0.5) * 0.004,
        rz: (Math.random() - 0.5) * 0.002,
      })
    }

    log(`spawned ${CUBE_COUNT} cubes`)

    let frame = 0
    let animId: number

    function animate() {
      animId = requestAnimationFrame(animate)
      frame++

      for (const { mesh, rx, ry, rz } of cubes) {
        mesh.rotation.x += rx
        mesh.rotation.y += ry
        mesh.rotation.z += rz
      }

      // Gentle group drift on Y
      group.position.y = Math.sin(frame * 0.0008) * 0.6

      renderer.render(scene, camera)
    }

    animate()

    function onResize() {
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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ opacity: 0.5 }}
    />
  )
}
