export function FormErrorBlock({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="text-xs text-destructive/80 mt-0.5">{message}</p>
    </div>
  )
}
