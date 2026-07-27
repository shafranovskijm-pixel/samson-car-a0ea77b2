
-- 1) service_categories
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_categories read for all"
  ON public.service_categories FOR SELECT
  USING (true);

CREATE POLICY "service_categories write for authenticated"
  ON public.service_categories FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER service_categories_set_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) brands.logo_url
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3) Seed стандартных категорий
INSERT INTO public.service_categories (name, sort_order) VALUES
  ('Жидкости и фильтры', 10),
  ('Двигатель и навесное оборудование', 20),
  ('Топливная система', 30),
  ('Ходовая часть и рулевое управление', 40),
  ('Регулировочные работы', 50),
  ('Тормозная система', 60),
  ('Кондиционер и отопление', 70),
  ('Шиномонтажные работы', 80),
  ('Электрика и электроника', 90),
  ('Прочие услуги', 100)
ON CONFLICT (name) DO NOTHING;

-- 4) Автоматически создать категории для уже существующих услуг
INSERT INTO public.service_categories (name, sort_order)
  SELECT DISTINCT s.category, 200
  FROM public.services s
  WHERE s.category IS NOT NULL
    AND s.category <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.service_categories c
      WHERE lower(c.name) = lower(s.category)
    )
ON CONFLICT (name) DO NOTHING;
