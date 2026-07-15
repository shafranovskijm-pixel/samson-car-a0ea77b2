
CREATE TABLE public.car_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  tier text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.car_models TO anon, authenticated;
GRANT ALL ON public.car_models TO service_role;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.car_models FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX car_models_brand_id_idx ON public.car_models(brand_id);

ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.car_models(id) ON DELETE SET NULL;
