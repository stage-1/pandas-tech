'use client'

import React, { useRef, useState } from 'react'
import { Camera, Loader2, Upload, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const CONFIDENCE_THRESHOLD = 0.85

type Phase =
  | { name: 'idle' }
  | { name: 'previewing'; file: File; previewUrl: string }
  | { name: 'scanning'; previewUrl: string }
  | { name: 'result'; vin: string; confidence: number; previewUrl: string }
  | { name: 'error'; message: string }

interface VinScannerProps {
  onConfirm: (vin: string) => void
  trigger: React.ReactElement<{ onClick?: () => void }>
}

export function VinScanner({ onConfirm, trigger }: VinScannerProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function revokePreview(p: Phase) {
    if (p.name === 'previewing' || p.name === 'scanning' || p.name === 'result') {
      URL.revokeObjectURL(p.previewUrl)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    revokePreview(phase)
    const previewUrl = URL.createObjectURL(file)
    setPhase({ name: 'previewing', file, previewUrl })
    e.target.value = ''
  }

  async function handleAnalyze() {
    if (phase.name !== 'previewing') return
    const { file, previewUrl } = phase
    setPhase({ name: 'scanning', previewUrl })

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/vin-scan', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Error del servidor')
      const data = await res.json() as { vin: string; confidence: number }
      const vin = data.vin.toUpperCase()
      const { confidence } = data

      // Auto-confirm and close on high confidence
      if (confidence >= CONFIDENCE_THRESHOLD) {
        onConfirm(vin)
        URL.revokeObjectURL(previewUrl)
        setOpen(false)
        setTimeout(() => setPhase({ name: 'idle' }), 200)
        return
      }

      setPhase({ name: 'result', vin, confidence, previewUrl })
    } catch {
      setPhase({ name: 'error', message: 'No se pudo analizar la imagen. Intenta de nuevo.' })
    }
  }

  function handleReset() {
    revokePreview(phase)
    setPhase({ name: 'idle' })
  }

  function handleConfirm() {
    if (phase.name !== 'result') return
    onConfirm(phase.vin)
    handleClose()
  }

  function handleClose() {
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

        {/* result (low confidence only — high confidence auto-confirms) */}
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

        {/* error */}
        {phase.name === 'error' && (
          <p className="text-sm text-destructive py-1">{phase.message}</p>
        )}

        {/* footer — only when there are actions */}
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
        {phase.name === 'error' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset} className="w-full">Reintentar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
