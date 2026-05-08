ALTER TABLE public.vehicles
  ADD COLUMN odometer integer CHECK (odometer >= 0);
