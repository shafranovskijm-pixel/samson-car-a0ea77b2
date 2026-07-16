-- 1) mechanic_service_rates
CREATE TABLE public.mechanic_service_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mechanic_id UUID NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mechanic_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mechanic_service_rates TO authenticated;
GRANT ALL ON public.mechanic_service_rates TO service_role;
ALTER TABLE public.mechanic_service_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manages mechanic_service_rates"
  ON public.mechanic_service_rates FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER set_mechanic_service_rates_updated_at
  BEFORE UPDATE ON public.mechanic_service_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) mechanic_shifts
CREATE TABLE public.mechanic_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mechanic_id UUID NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mechanic_shifts TO authenticated;
GRANT ALL ON public.mechanic_shifts TO service_role;
ALTER TABLE public.mechanic_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manages mechanic_shifts"
  ON public.mechanic_shifts FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX mechanic_shifts_mechanic_id_idx ON public.mechanic_shifts(mechanic_id);
CREATE INDEX mechanic_shifts_starts_at_idx ON public.mechanic_shifts(starts_at);
CREATE TRIGGER set_mechanic_shifts_updated_at
  BEFORE UPDATE ON public.mechanic_shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) mechanic_payout in appointment_services
ALTER TABLE public.appointment_services
  ADD COLUMN mechanic_payout NUMERIC NOT NULL DEFAULT 0;