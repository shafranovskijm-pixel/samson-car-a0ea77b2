ALTER TABLE public.gym_trainers
  ADD COLUMN IF NOT EXISTS login text,
  ADD COLUMN IF NOT EXISTS password text;

CREATE UNIQUE INDEX IF NOT EXISTS gym_trainers_login_key ON public.gym_trainers (lower(login)) WHERE login IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.gym_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES public.gym_trainers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  period_from date,
  period_to date,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gym_payouts_trainer_idx ON public.gym_payouts (trainer_id, paid_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_payouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_payouts TO anon;
GRANT ALL ON public.gym_payouts TO service_role;

ALTER TABLE public.gym_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gym_payouts all access" ON public.gym_payouts;
CREATE POLICY "gym_payouts all access" ON public.gym_payouts FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_updated_at_gym_payouts ON public.gym_payouts;
CREATE TRIGGER set_updated_at_gym_payouts BEFORE UPDATE ON public.gym_payouts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();