import { ROForm } from './ROForm'

export default function NewRepairOrderPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Nueva orden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El cliente, vehículo y moneda coincidirán con tu taller tras guardar.
        </p>
      </div>
      <ROForm />
    </div>
  )
}
