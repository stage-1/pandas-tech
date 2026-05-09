'use client'

import React, { useRef, useState } from 'react'
import { Camera, Loader2, Upload, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { VehicleSpecs } from '@/lib/vehicles'

const CONFIDENCE_THRESHOLD = 0.85

type Phase =
  | { name: 'idle' }
  | { name: 'previewing'; file: File; previewUrl: string }
  | { name: 'scanning'; previewUrl: string }
  | { name: 'result'; vin: string; confidence: number; previewUrl: string }
  | { name: 'decoding'; vin: string; previewUrl: string }
  | { name: 'decode-failed'; vin: string; previewUrl: string }
  | { name: 'funny'; previewUrl: string; comment: string }
  | { name: 'error'; message: string }

interface VinScannerProps {
  onVinDecoded: (vin: string, specs: VehicleSpecs | null) => void
  trigger: React.ReactElement<{ onClick?: () => void }>
}

export function VinScanner({ onVinDecoded, trigger }: VinScannerProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [decodeEnabled, setDecodeEnabled] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const decodeFailedCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearDecodeFailedCloseTimer() {
    if (decodeFailedCloseTimerRef.current != null) {
      clearTimeout(decodeFailedCloseTimerRef.current)
      decodeFailedCloseTimerRef.current = null
    }
  }

  function revokePreview(p: Phase) {
    if (
      p.name === 'previewing' ||
      p.name === 'scanning' ||
      p.name === 'result' ||
      p.name === 'decoding' ||
      p.name === 'decode-failed' ||
      p.name === 'funny'
    ) {
      URL.revokeObjectURL(p.previewUrl)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('[vin-scanner] file selected', { name: file.name, type: file.type, sizeKb: Math.round(file.size / 1024) })
    revokePreview(phase)
    const previewUrl = URL.createObjectURL(file)
    setPhase({ name: 'previewing', file, previewUrl })
    e.target.value = ''
  }

  async function handleAnalyze() {
    if (phase.name !== 'previewing') return
    const { file, previewUrl } = phase
    setPhase({ name: 'scanning', previewUrl })
    console.log('[vin-scanner] sending to API')

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/vin-scan', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Error del servidor')
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
  }

  async function decodeAndConfirm(vin: string, previewUrl: string) {
    setPhase({ name: 'decoding', vin, previewUrl })

    console.log('[vin-scanner] starting decode for vin=%s decodeEnabled=%s', vin, decodeEnabled)

    let specs: VehicleSpecs | null = null
    if (decodeEnabled) try {
      console.log('[vin-scanner] posting to /api/vin-decode')
      const res = await fetch('/api/vin-decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin }),
      })
      console.log('[vin-scanner] response status=%d ok=%s', res.status, res.ok)

      const raw = await res.text()
      console.log('[vin-scanner] raw response body:', raw)

      const data = JSON.parse(raw) as { specs: VehicleSpecs | null }
      console.log('[vin-scanner] decode response %o', data)
      console.log('[vin-scanner] specs keys:', data.specs ? Object.keys(data.specs) : 'null')
      console.log('[vin-scanner] specs has any values:', data.specs ? Object.values(data.specs).some(v => v != null) : false)

      specs = data.specs
    } catch (err) {
      console.error('[vin-scanner] decode error (degrading gracefully) %o', err)
    }

    console.log('[vin-scanner] calling onVinDecoded with vin=%s specs=%o', vin, specs)
    onVinDecoded(vin, specs)

    if (!specs && decodeEnabled) {
      console.log('[vin-scanner] decode enabled but no specs — showing decode-failed phase')
      setPhase({ name: 'decode-failed', vin, previewUrl })
      clearDecodeFailedCloseTimer()
      decodeFailedCloseTimerRef.current = setTimeout(() => {
        decodeFailedCloseTimerRef.current = null
        URL.revokeObjectURL(previewUrl)
        setOpen(false)
        setTimeout(() => setPhase({ name: 'idle' }), 200)
      }, 2500)
      return
    }

    URL.revokeObjectURL(previewUrl)
    setOpen(false)
    setTimeout(() => setPhase({ name: 'idle' }), 200)
  }

  function handleReset() {
    revokePreview(phase)
    setPhase({ name: 'idle' })
  }

  async function handleConfirm() {
    if (phase.name !== 'result') return
    await decodeAndConfirm(phase.vin, phase.previewUrl)
  }

  function handleClose() {
    clearDecodeFailedCloseTimer()
    revokePreview(phase)
    setOpen(false)
    setTimeout(() => setPhase({ name: 'idle' }), 200)
  }

  const clonedTrigger = React.cloneElement(trigger, { onClick: () => setOpen(true) })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      {clonedTrigger}

      <DialogContent showCloseButton className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Escanear VIN</DialogTitle>
        </DialogHeader>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* idle */}
        {phase.name === 'idle' && (
          <div className="flex flex-col gap-3 py-1">
            <p className="text-sm text-muted-foreground">
              Toma una foto del VIN en el tablero, el pilar de la puerta o el parabrisas.
            </p>
            <Button onClick={() => cameraRef.current?.click()} className="w-full gap-2">
              <Camera className="size-4" />
              Tomar foto
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full gap-2">
              <Upload className="size-4" />
              Subir imagen
            </Button>
            <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Decodificar datos del vehículo</span>
                <span className="text-xs text-muted-foreground">Consulta Vincario para obtener specs técnicas</span>
              </div>
              <Switch
                size="sm"
                checked={decodeEnabled}
                onCheckedChange={setDecodeEnabled}
              />
            </label>
          </div>
        )}

        {/* previewing */}
        {phase.name === 'previewing' && (
          <img
            src={phase.previewUrl}
            alt="Vista previa"
            className="w-full rounded-lg object-cover max-h-56"
          />
        )}

        {/* scanning */}
        {phase.name === 'scanning' && (
          <div className="relative">
            <img
              src={phase.previewUrl}
              alt="Analizando"
              className="w-full rounded-lg object-cover max-h-56 opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-foreground" />
              <span className="text-sm font-medium">Analizando VIN…</span>
            </div>
          </div>
        )}

        {/* decoding */}
        {phase.name === 'decoding' && (
          <div className="relative">
            <img
              src={phase.previewUrl}
              alt="Decodificando"
              className="w-full rounded-lg object-cover max-h-56 opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-foreground" />
              <span className="text-sm font-medium">Decodificando datos del vehículo…</span>
            </div>
          </div>
        )}

        {/* result (low confidence only) */}
        {phase.name === 'result' && (
          <>
            <img
              src={phase.previewUrl}
              alt="Resultado"
              className="w-full rounded-lg object-cover max-h-56"
            />
            <div className="rounded-lg border bg-muted/50 p-3 flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                VIN detectado
              </span>
              <span className="font-mono text-base font-semibold tracking-widest break-all">
                {phase.vin}
              </span>
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                <span className="text-amber-600 dark:text-amber-400">
                  Confianza baja ({Math.round(phase.confidence * 100)}%) — intenta con mejor iluminación
                </span>
              </div>
            </div>
          </>
        )}

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

        {/* decode failed (API/key/no data) while decode toggle was on */}
        {phase.name === 'decode-failed' && (
          <div className="flex flex-col gap-2 py-1">
            <p className="text-sm text-muted-foreground">
              VIN guardado, pero no se pudieron obtener los datos del vehículo.
            </p>
          </div>
        )}

        {/* error */}
        {phase.name === 'error' && (
          <p className="text-sm text-destructive py-1">{phase.message}</p>
        )}

        {/* footer */}
        {phase.name === 'previewing' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>Cancelar</Button>
            <Button onClick={handleAnalyze}>Analizar</Button>
          </DialogFooter>
        )}
        {phase.name === 'result' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>Reintentar</Button>
            <Button variant="secondary" onClick={handleConfirm}>Usar de todas formas</Button>
          </DialogFooter>
        )}
        {phase.name === 'funny' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset} className="w-full">Reintentar</Button>
          </DialogFooter>
        )}
        {phase.name === 'error' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset} className="w-full">Reintentar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
