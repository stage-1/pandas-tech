ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS transit_license_no  text,
  ADD COLUMN IF NOT EXISTS engine_number        text,
  ADD COLUMN IF NOT EXISTS serial_number        text,
  ADD COLUMN IF NOT EXISTS vehicle_class        text,
  ADD COLUMN IF NOT EXISTS service_type         text,
  ADD COLUMN IF NOT EXISTS axle_count           smallint CHECK (axle_count BETWEEN 1 AND 20),
  ADD COLUMN IF NOT EXISTS registration_city    text;
