
CREATE TABLE public.appointment_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  method TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_payments_appt ON public.appointment_payments(appointment_id);
CREATE INDEX idx_appointment_payments_paid_at ON public.appointment_payments(paid_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_payments TO authenticated, anon;
GRANT ALL ON public.appointment_payments TO service_role;

ALTER TABLE public.appointment_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.appointment_payments FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_appointment_payments_updated_at
BEFORE UPDATE ON public.appointment_payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Расширяем допустимые значения payment_status: добавляем 'partial'
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_payment_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_payment_status_check
  CHECK (payment_status = ANY (ARRAY['paid'::text, 'prepaid'::text, 'partial'::text, 'unpaid'::text]));

-- Функция пересчёта paid_amount/payment_status по журналу платежей
CREATE OR REPLACE FUNCTION public.recompute_appointment_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  target_id UUID;
  total NUMERIC;
  paid NUMERIC;
  new_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.appointment_id;
  ELSE
    target_id := NEW.appointment_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO paid
  FROM public.appointment_payments WHERE appointment_id = target_id;

  SELECT total_price INTO total FROM public.appointments WHERE id = target_id;

  IF paid <= 0 THEN
    new_status := 'unpaid';
  ELSIF total IS NULL OR paid >= total THEN
    new_status := 'paid';
  ELSE
    new_status := 'partial';
  END IF;

  UPDATE public.appointments
    SET paid_amount = paid, payment_status = new_status
    WHERE id = target_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_appointment_payments_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.appointment_payments
FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();

-- Бэкфилл: перенести существующие paid_amount в журнал одним платежом на дату записи
INSERT INTO public.appointment_payments (appointment_id, paid_at, amount, note)
SELECT id, starts_at::date, paid_amount, 'Импорт из paid_amount'
FROM public.appointments
WHERE paid_amount > 0;
