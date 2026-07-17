
-- 1) expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon, authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_expenses_spent_at ON public.expenses(spent_at);

-- 2) mechanic_advances
CREATE TABLE public.mechanic_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mechanic_id UUID NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mechanic_advances TO anon, authenticated;
GRANT ALL ON public.mechanic_advances TO service_role;
ALTER TABLE public.mechanic_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.mechanic_advances FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_mechanic_advances_updated_at BEFORE UPDATE ON public.mechanic_advances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_mechanic_advances_paid_at ON public.mechanic_advances(paid_at);
CREATE INDEX idx_mechanic_advances_mechanic ON public.mechanic_advances(mechanic_id);

-- 3) default payout percent on services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS default_payout_percent NUMERIC NOT NULL DEFAULT 50;
