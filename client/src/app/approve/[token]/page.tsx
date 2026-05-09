import { notFound } from 'next/navigation'
import { sql } from '@/lib/postgres'
import { formatMinor } from '@/lib/format-currency'
import { ApproveActions } from './ApproveActions'

export default async function ApproveByTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  if (!token || token.length < 16) notFound()

  const rows = await sql<Array<{ data: unknown }>>`
    SELECT public.get_repair_order_by_token(${token}) AS data
  `
  const raw = rows[0]?.data
  if (raw == null) notFound()

  let payload: unknown = raw
  if (typeof raw === 'string') {
    try {
      payload = JSON.parse(raw) as unknown
    } catch {
      notFound()
    }
  }

  if (!payload || typeof payload !== 'object') notFound()
  const p = payload as Record<string, unknown>
  const ro = p.repair_order as Record<string, unknown> | undefined
  if (!ro) notFound()

  const shop = (p.shop as Record<string, unknown>) ?? {}
  const vehicle = (p.vehicle as Record<string, unknown>) ?? {}
  const lineItems = Array.isArray(p.line_items) ? p.line_items : []

  const cur = String(ro.currency ?? 'USD').trim() || 'USD'
  const status = String(ro.status ?? '')

  return (
    <div className="flex min-h-svh flex-col items-center bg-muted/30 px-4 py-10">
      <article className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm ring-1 ring-black/5">
        <header className="border-b border-border pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Aprobación de orden
          </p>
          <h1 className="font-display mt-2 text-xl font-bold">Orden #{String(ro.ro_number ?? '')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{String(shop.name ?? 'Taller')}</p>
        </header>

        <section className="space-y-2 py-4 text-sm">
          <p>
            <span className="text-muted-foreground">Vehículo:</span>{' '}
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || '—'}
          </p>
          {vehicle.license_plate != null && String(vehicle.license_plate) !== '' && (
            <p>
              <span className="text-muted-foreground">Placa:</span> {String(vehicle.license_plate)}
            </p>
          )}
          {ro.complaint != null && String(ro.complaint).trim() !== '' && (
            <div className="rounded-md bg-muted/50 p-3 text-xs">
              <p className="font-medium text-muted-foreground">Motivo</p>
              <p className="mt-1 whitespace-pre-wrap">{String(ro.complaint)}</p>
            </div>
          )}
        </section>

        {lineItems.length > 0 && (
          <section className="border-t border-border py-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Líneas
            </h2>
            <ul className="space-y-2 text-sm">
              {lineItems.map((li) => {
                const row = li as Record<string, unknown>
                const desc = String(row.description ?? '')
                const qty = Number(row.qty ?? 0)
                const up = Number(row.unit_price_minor ?? 0)
                const lineTotal = qty * up
                return (
                  <li key={String(row.id ?? desc)} className="flex justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      {row.type === 'part' ? 'Parte' : 'Mano de obra'} · {desc}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {qty} × {formatMinor(up, cur)} = {formatMinor(lineTotal, cur)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <footer className="border-t border-border pt-4 space-y-3">
          <p className="text-base font-semibold tabular-nums">
            Total estimado: {formatMinor(Number(ro.total_minor ?? 0), cur)}
          </p>
          <ApproveActions token={token} status={status} />
        </footer>
      </article>
    </div>
  )
}
