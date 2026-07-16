
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_payment_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_payment_status_check
  CHECK (payment_status IN ('paid','prepaid','unpaid'));
