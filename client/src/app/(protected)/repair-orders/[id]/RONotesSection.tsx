'use client'

import { useEffect, useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc'

function norm(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

export function RONotesSection({
  repairOrderId,
  complaint: initialComplaint,
  internal_notes: initialNotes,
}: {
  repairOrderId: string
  complaint: string | null
  internal_notes: string | null
}) {
  const [complaint, setComplaint] = useState(initialComplaint ?? '')
  const [internalNotes, setInternalNotes] = useState(initialNotes ?? '')
  const skipNext = useRef(true)
  const lastSaved = useRef({
    complaint: norm(initialComplaint ?? ''),
    internal_notes: norm(initialNotes ?? ''),
  })

  useEffect(() => {
    const c0 = initialComplaint ?? ''
    const n0 = initialNotes ?? ''
    setComplaint(c0)
    setInternalNotes(n0)
    lastSaved.current = {
      complaint: norm(c0),
      internal_notes: norm(n0),
    }
    skipNext.current = true
  }, [initialComplaint, initialNotes])

  const utils = trpc.useUtils()
  const update = trpc.repairOrders.update.useMutation({
    async onSuccess() {
      console.log('[RONotesSection] persisted')
      await utils.repairOrders.byId.invalidate({ id: repairOrderId })
      await utils.repairOrders.list.invalidate()
    },
  })

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false
      return
    }

    const tid = window.setTimeout(() => {
      const c = norm(complaint)
      const n = norm(internalNotes)
      const prev = lastSaved.current
      if (c === prev.complaint && n === prev.internal_notes) return

      console.log('[RONotesSection] debounced save')

      update.mutate(
        { id: repairOrderId, complaint: c, internal_notes: n },
        {
          onSuccess: () => {
            lastSaved.current = { complaint: c, internal_notes: n }
          },
        },
      )
    }, 800)

    return () => window.clearTimeout(tid)
  }, [complaint, internalNotes, repairOrderId, update])

  return (
    <section className="rounded-xl border border-border space-y-4 p-4">
      <h2 className="text-sm font-medium text-foreground">Queja y notas</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="complaint">Queja / síntomas (cliente)</Label>
          <Textarea
            id="complaint"
            rows={4}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="internal_notes">Notas internas</Label>
          <Textarea
            id="internal_notes"
            rows={4}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>
      {update.isPending && (
        <p className="text-[0.6875rem] text-muted-foreground">Guardando…</p>
      )}
      {update.error?.message && (
        <p className="text-xs text-destructive">{update.error.message}</p>
      )}
    </section>
  )
}
