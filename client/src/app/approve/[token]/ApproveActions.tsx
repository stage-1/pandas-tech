'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function ApproveActions({ token, status }: { token: string; status: string }) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const approve = trpc.repairOrders.approveByToken.useMutation({
    onSuccess(res) {
      console.log('[ApproveActions] approve result', res.ok)
      if (!res.ok) setMsg('No se pudo aprobar (¿ya estaba aprobada o no está pendiente?).')
      else {
        setMsg(null)
        router.refresh()
      }
    },
    onError(err) {
      setMsg(err.message)
    },
  })

  const decline = trpc.repairOrders.declineByToken.useMutation({
    onSuccess(res) {
      console.log('[ApproveActions] decline result', res.ok)
      if (!res.ok) setMsg('No se pudo rechazar.')
      else {
        setMsg(null)
        router.refresh()
      }
    },
    onError(err) {
      setMsg(err.message)
    },
  })

  if (status !== 'pending') {
    return (
      <p className="text-sm text-muted-foreground">
        {status === 'approved'
          ? 'Esta orden ya fue aprobada. Gracias.'
          : status === 'declined'
            ? 'Esta orden fue rechazada.'
            : `Estado actual: ${status}. No se requiere acción aquí.`}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={approve.isPending || decline.isPending}
          onClick={() => approve.mutate({ token })}
        >
          {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Aprobar'}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger render={<Button type="button" variant="outline" />}>
            Rechazar
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Motivo del rechazo</AlertDialogTitle>
            </AlertDialogHeader>
            <div>
              <Label htmlFor="decline-reason">Comentario (obligatorio)</Label>
              <Textarea
                id="decline-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={decline.isPending || !reason.trim()}
                onClick={() => {
                  decline.mutate({ token, reason: reason.trim() })
                }}
              >
                {decline.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Confirmar rechazo'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {msg && <p className="text-xs text-destructive">{msg}</p>}
    </div>
  )
}
