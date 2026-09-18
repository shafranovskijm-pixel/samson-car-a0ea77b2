ALTER TABLE public.gym_entries
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS frozen boolean NOT NULL DEFAULT false;

UPDATE public.gym_entries SET paid_amount = amount WHERE paid = true AND paid_amount = 0;