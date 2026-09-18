ALTER TABLE public.gym_entries
  ADD COLUMN IF NOT EXISTS sessions_total integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sessions_used integer NOT NULL DEFAULT 0;

UPDATE public.gym_entries
SET sessions_total = CASE WHEN package ~ '^[0-9]+$' THEN GREATEST(1, package::int) ELSE 1 END
WHERE sessions_total = 1;

CREATE TABLE IF NOT EXISTS public.gym_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL DEFAULT current_date,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_expenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_expenses TO authenticated;
GRANT ALL ON public.gym_expenses TO service_role;

ALTER TABLE public.gym_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access" ON public.gym_expenses;
CREATE POLICY "Public full access" ON public.gym_expenses FOR ALL USING (true) WITH CHECK (true);