'use client'

import React, { useRef, useState } from 'react'
import { Camera, Upload, Loader2, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { trpc } from '@/lib/trpc'
import {
  CONFIDENCE_THRESHOLD,
  FIELD_CONFIG,
  FIELD_KEYS,
  type PropertyCardAiResult,
  type PropertyCardFieldKey,
  type PropertyCardScanResult,
  type ResolvedPropertyCardFields,
} from '@/lib/property-card-scan'

type Phase =
  | { name: 'idle' }
  | { name: 'previewing'; file: File; previewUrl: string }
  | { name: 'scanning'; previewUrl: string }
  | { name: 'review'; result: PropertyCardAiResult; imagePath: string | null; previewUrl: string; edits: Partial<Record<PropertyCardFieldKey, string>>; showConfirmed: boolean }
  | { name: 'saving'; previewUrl: string }
  | { name: 'funny'; previewUrl: string; comment: string }
  | { name: 'error'; message: string }

interface PropertyCardScannerProps {
  onPropertyCardScanned: (result: PropertyCardScanResult) => void
  trigger: React.ReactElement<{ onClick?: () => void }>
}

export function PropertyCardScanner({ onPropertyCardScanned, trigger }: PropertyCardScannerProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const isMobile = useIsMobile()
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const createScan = trpc.propertyCardScans.create.useMutation()

  function revokePreview(p: Phase) {
    if ('previewUrl' in p) URL.revokeObjectURL(p.previewUrl)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    revokePreview(phase)
    setPhase({ name: 'previewing', file, previewUrl: URL.createObjectURL(file) })
    e.target.value = ''
  }

  function handleReset() {
    revokePreview(phase)
    setPhase({ name: 'idle' })
  }

  function handleClose() {
    revokePreview(phase)
    setOpen(false)
    setTimeout(() => setPhase({ name: 'idle' }), 200)
  }

  async function saveAndCallback(
    result: PropertyCardAiResult,
    edits: Partial<Record<PropertyCardFieldKey, string>>,
    previewUrl: string,
    imagePath: string | null,
  ) {
    const confirmedFields = Object.fromEntries(
      FIELD_KEYS.map(key => {
        const override = edits[key]
        return [key, override !== undefined ? override : result.fields[key].value]
      }),
    ) as ResolvedPropertyCardFields

    const flagged = FIELD_KEYS.filter(k => result.fields[k].confidence < CONFIDENCE_THRESHOLD)
    const edited  = FIELD_KEYS.filter(k => edits[k] !== undefined)
    const avgConf = Math.round(
      FIELD_KEYS.reduce((sum, k) => sum + result.fields[k].confidence, 0) / FIELD_KEYS.length,
    )

    setPhase({ name: 'saving', previewUrl })

    try {
      const { id: scanId } = await createScan.mutateAsync({
        ai_result:           result,
        confirmed_fields:    confirmedFields,
        overall_confidence:  avgConf,
        fields_flagged:      flagged,
        fields_user_edited:  edited,
        image_storage_path:  imagePath,
      })

      onPropertyCardScanned({ fields: confirmedFields, scanId })
      URL.revokeObjectURL(previewUrl)
      setOpen(false)
      setTimeout(() => setPhase({ name: 'idle' }), 200)
    } catch {
      setPhase({ name: 'error', message: 'No se pudo guardar el escaneo. Intenta de nuevo.' })
    }
  }

  async function handleAnalyze() {
    if (phase.name !== 'previewing') return
    const { file, previewUrl } = phase
    setPhase({ name: 'scanning', previewUrl })

    const formData = new FormData()
    formData.append('image', file)

    let res: Response
    try {
      res = await fetch('/api/property-card-scan', { method: 'POST', body: formData })
    } catch {
      setPhase({ name: 'error', message: 'No se pudo analizar la imagen. Intenta de nuevo.' })
      return
    }

    if (res.status === 429) {
      setPhase({ name: 'error', message: 'Límite de escaneos alcanzado. Intenta más tarde.' })
      return
    }
    if (res.status === 422) {
      setPhase({ name: 'error', message: 'La imagen no pudo ser procesada.' })
      return
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setPhase({ name: 'error', message: body.error ?? 'Imagen no válida. Verifica el archivo e intenta de nuevo.' })
      return
    }

    try {
      const { imagePath, ...data } = await res.json() as PropertyCardAiResult & { imagePath?: string | null }

      if (!data.is_valid_property_card) {
        setPhase({ name: 'funny', previewUrl, comment: data.funny_comment })
        return
      }

      const flagged = FIELD_KEYS.filter(k => data.fields[k].confidence < CONFIDENCE_THRESHOLD)
      if (flagged.length === 0) {
        await saveAndCallback(data, {}, previewUrl, imagePath ?? null)
        return
      }

      setPhase({ name: 'review', result: data, imagePath: imagePath ?? null, previewUrl, edits: {}, showConfirmed: false })
    } catch {
      setPhase({ name: 'error', message: 'No se pudo analizar la imagen. Intenta de nuevo.' })
    }
  }

  async function handleConfirm() {
    if (phase.name !== 'review') return
    await saveAndCallback(phase.result, phase.edits, phase.previewUrl, phase.imagePath)
  }

  // pre-compute review data to avoid IIFE in JSX
  const reviewFlagged   = phase.name === 'review' ? FIELD_KEYS.filter(k => phase.result.fields[k].confidence < CONFIDENCE_THRESHOLD)  : []
  const reviewConfirmed = phase.name === 'review' ? FIELD_KEYS.filter(k => phase.result.fields[k].confidence >= CONFIDENCE_THRESHOLD) : []

  const clonedTrigger = React.cloneElement(trigger, { onClick: () => setOpen(true) })

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose() }}>
      {clonedTrigger}

      <DialogContent
        showCloseButton
        className={!isMobile && phase.name === 'review' ? 'sm:max-w-2xl' : 'sm:max-w-sm'}
      >
        <DialogHeader>
          <DialogTitle>Escanear tarjeta de propiedad</DialogTitle>
        </DialogHeader>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
        <input ref={fileRef}   type="file" accept="image/*"                        className="hidden" onChange={handleFileSelect} />

        {/* idle */}
        {phase.name === 'idle' && (
          <div className="flex flex-col gap-3 py-1">
            <p className="text-sm text-muted-foreground">
              Toma una foto de la tarjeta de propiedad del vehículo.
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
          <img src={phase.previewUrl} alt="Vista previa" className="w-full rounded-lg object-cover max-h-56" />
        )}

        {/* scanning / saving */}
        {(phase.name === 'scanning' || phase.name === 'saving') && (
          <div className="relative">
            <img src={phase.previewUrl} alt="Procesando" className="w-full rounded-lg object-cover max-h-56 opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-foreground" />
              <span className="text-sm font-medium">
                {phase.name === 'scanning' ? 'Analizando tarjeta…' : 'Guardando…'}
              </span>
            </div>
          </div>
        )}

        {/* review */}
        {phase.name === 'review' && (
          <>
            {isMobile ? (
              <div className="flex flex-col gap-4">
                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted-foreground flex items-center gap-1.5 list-none select-none">
                    <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                    Ver imagen escaneada
                  </summary>
                  <img src={phase.previewUrl} alt="Tarjeta escaneada" className="w-full rounded-lg object-cover max-h-48 mt-2" />
                </details>
                <ReviewFields
                  phase={phase}
                  flaggedKeys={reviewFlagged}
                  confirmedKeys={reviewConfirmed}
                  setPhase={setPhase}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 max-h-[440px]">
                <img
                  src={phase.previewUrl}
                  alt="Tarjeta escaneada"
                  className="w-full rounded-lg object-contain self-start sticky top-0 max-h-[440px]"
                />
                <div className="overflow-y-auto pr-1">
                  <ReviewFields
                    phase={phase}
                    flaggedKeys={reviewFlagged}
                    confirmedKeys={reviewConfirmed}
                    setPhase={setPhase}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* funny */}
        {phase.name === 'funny' && (
          <div className="flex flex-col gap-3">
            <img src={phase.previewUrl} alt="No es una tarjeta" className="w-full rounded-lg object-cover max-h-56" />
            <p className="text-sm text-center">{phase.comment}</p>
          </div>
        )}

        {/* error */}
        {phase.name === 'error' && (
          <p className="text-sm text-destructive py-1">{phase.message}</p>
        )}

        {/* footers */}
        {phase.name === 'previewing' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>Cancelar</Button>
            <Button onClick={handleAnalyze}>Analizar</Button>
          </DialogFooter>
        )}
        {phase.name === 'review' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>Reintentar</Button>
            <Button onClick={handleConfirm}>Confirmar</Button>
          </DialogFooter>
        )}
        {(phase.name === 'funny' || phase.name === 'error') && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset} className="w-full">Reintentar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Review fields sub-component ───────────────────────────────────────────────

type ReviewPhase = Extract<Phase, { name: 'review' }>

function ReviewFields({
  phase,
  flaggedKeys,
  confirmedKeys,
  setPhase,
}: {
  phase: ReviewPhase
  flaggedKeys: PropertyCardFieldKey[]
  confirmedKeys: PropertyCardFieldKey[]
  setPhase: React.Dispatch<React.SetStateAction<Phase>>
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* flagged — editable */}
      {flaggedKeys.map(key => (
        <div key={key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{FIELD_CONFIG[key].label}</Label>
            <span className="text-xs text-amber-500 font-medium tabular-nums">
              {Math.round(phase.result.fields[key].confidence)}%
            </span>
          </div>
          <div className="relative">
            <AlertTriangle className="absolute left-2.5 top-2.5 size-3.5 text-amber-500 pointer-events-none" />
            <Input
              className="pl-8 border-amber-500/40 focus-visible:ring-amber-500/30"
              value={phase.edits[key] ?? String(phase.result.fields[key].value ?? '')}
              onChange={e => {
                const val = e.target.value
                setPhase(p => p.name === 'review' ? { ...p, edits: { ...p.edits, [key]: val } } : p)
              }}
            />
          </div>
        </div>
      ))}

      {/* confirmed — collapsible */}
      {confirmedKeys.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setPhase(p => p.name === 'review' ? { ...p, showConfirmed: !p.showConfirmed } : p)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
              {confirmedKeys.length} campos detectados correctamente
            </span>
            {phase.showConfirmed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {phase.showConfirmed && (
            <div className="border-t divide-y">
              {confirmedKeys.map(key => (
                <div key={key} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-muted-foreground shrink-0">{FIELD_CONFIG[key].label}</span>
                  <span className="font-medium truncate max-w-[55%] text-right ml-2">
                    {String(phase.result.fields[key].value ?? '—')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
