
CREATE TABLE public.car_catalog_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX car_catalog_models_brand_name_uidx
  ON public.car_catalog_models (lower(brand_name), lower(name));
CREATE INDEX car_catalog_models_brand_idx
  ON public.car_catalog_models (lower(brand_name));

GRANT SELECT ON public.car_catalog_models TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_catalog_models TO authenticated;
GRANT ALL ON public.car_catalog_models TO service_role;

ALTER TABLE public.car_catalog_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read models"
  ON public.car_catalog_models FOR SELECT
  USING (true);
CREATE POLICY "Authenticated can insert models"
  ON public.car_catalog_models FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update models"
  ON public.car_catalog_models FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_car_catalog_models_updated_at
  BEFORE UPDATE ON public.car_catalog_models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.car_catalog_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.car_catalog_models(id) ON DELETE CASCADE,
  year INT NOT NULL,
  raw TEXT NOT NULL DEFAULT '',
  body_code TEXT,
  chassis_code TEXT,
  engine_code TEXT,
  displacement_cc INT,
  horsepower INT,
  fuel TEXT,
  hybrid BOOLEAN NOT NULL DEFAULT false,
  steering TEXT,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX car_catalog_modifications_uniq
  ON public.car_catalog_modifications (model_id, year, raw);
CREATE INDEX car_catalog_modifications_model_year_idx
  ON public.car_catalog_modifications (model_id, year);

GRANT SELECT ON public.car_catalog_modifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_catalog_modifications TO authenticated;
GRANT ALL ON public.car_catalog_modifications TO service_role;

ALTER TABLE public.car_catalog_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read modifications"
  ON public.car_catalog_modifications FOR SELECT
  USING (true);
CREATE POLICY "Authenticated can insert modifications"
  ON public.car_catalog_modifications FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update modifications"
  ON public.car_catalog_modifications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_car_catalog_modifications_updated_at
  BEFORE UPDATE ON public.car_catalog_modifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
