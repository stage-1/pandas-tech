import { CustomerForm } from './CustomerForm'

export default function NewCustomerPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Nuevo cliente
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra un cliente en tu taller.
        </p>
      </div>
      <CustomerForm />
    </div>
  )
}
