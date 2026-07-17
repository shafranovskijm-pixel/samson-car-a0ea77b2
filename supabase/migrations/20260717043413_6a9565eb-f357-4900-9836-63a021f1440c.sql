
CREATE TABLE public.car_custom_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  year INT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX car_custom_services_uniq
  ON public.car_custom_services
  (lower(brand_name), lower(model_name), year, category, lower(name));

CREATE INDEX car_custom_services_car_idx
  ON public.car_custom_services
  (lower(brand_name), lower(model_name), year);

GRANT SELECT ON public.car_custom_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_custom_services TO authenticated;
GRANT ALL ON public.car_custom_services TO service_role;

ALTER TABLE public.car_custom_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read car custom services"
  ON public.car_custom_services FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert car custom services"
  ON public.car_custom_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update car custom services"
  ON public.car_custom_services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete car custom services"
  ON public.car_custom_services FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_car_custom_services_updated_at
  BEFORE UPDATE ON public.car_custom_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
