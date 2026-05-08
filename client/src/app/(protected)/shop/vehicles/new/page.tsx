import { VehicleForm } from './VehicleForm'

export default function NewVehiclePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Nuevo vehículo
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra un vehículo en tu taller.
        </p>
      </div>
      <VehicleForm />
    </div>
  )
}
