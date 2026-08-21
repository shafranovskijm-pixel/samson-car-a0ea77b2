CREATE OR REPLACE FUNCTION public.trim_payments_on_total_decrease()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  excess NUMERIC;
  rec RECORD;
  cut NUMERIC;
  paid NUMERIC;
  new_status TEXT;
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO paid
  FROM public.appointment_payments WHERE appointment_id = NEW.id;

  excess := paid - COALESCE(NEW.total_price, 0);
  IF excess <= 0 THEN
    RETURN NULL;
  END IF;

  FOR rec IN
    SELECT id, amount FROM public.appointment_payments
    WHERE appointment_id = NEW.id
    ORDER BY paid_at DESC, created_at DESC
  LOOP
    EXIT WHEN excess <= 0;
    IF rec.amount <= excess THEN
      DELETE FROM public.appointment_payments WHERE id = rec.id;
      excess := excess - rec.amount;
    ELSE
      cut := rec.amount - excess;
      UPDATE public.appointment_payments SET amount = cut WHERE id = rec.id;
      excess := 0;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(amount), 0) INTO paid
  FROM public.appointment_payments WHERE appointment_id = NEW.id;

  IF paid <= 0 THEN
    new_status := 'unpaid';
  ELSIF COALESCE(NEW.total_price, 0) > 0 AND paid >= NEW.total_price THEN
    new_status := 'paid';
  ELSE
    new_status := 'partial';
  END IF;

  UPDATE public.appointments
     SET paid_amount = paid, payment_status = new_status
   WHERE id = NEW.id
     AND (paid_amount IS DISTINCT FROM paid OR payment_status IS DISTINCT FROM new_status);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_trim_payments_on_total_decrease ON public.appointments;
CREATE TRIGGER trg_trim_payments_on_total_decrease
AFTER UPDATE OF total_price ON public.appointments
FOR EACH ROW
WHEN (NEW.total_price IS DISTINCT FROM OLD.total_price)
EXECUTE FUNCTION public.trim_payments_on_total_decrease();

-- Fix existing overpaid rows
UPDATE public.appointment_payments p
   SET amount = a.total_price
  FROM public.appointments a
 WHERE p.appointment_id = a.id
   AND a.deleted_at IS NULL
   AND a.paid_amount > a.total_price
   AND p.id = (
     SELECT p2.id FROM public.appointment_payments p2
      WHERE p2.appointment_id = a.id
      ORDER BY p2.paid_at DESC, p2.created_at DESC LIMIT 1
   )
   AND (SELECT COUNT(*) FROM public.appointment_payments p3 WHERE p3.appointment_id = a.id) = 1;