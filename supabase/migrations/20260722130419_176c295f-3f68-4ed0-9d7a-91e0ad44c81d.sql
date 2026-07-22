-- Trigger: recompute total_price whenever appointment_services change,
-- and clamp paid_amount + payment_status if total drops below paid amount.
CREATE OR REPLACE FUNCTION public.recompute_appointment_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  target_id UUID;
  new_total NUMERIC;
  paid NUMERIC;
  new_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.appointment_id;
  ELSE
    target_id := NEW.appointment_id;
  END IF;

  SELECT COALESCE(SUM(price), 0) INTO new_total
  FROM public.appointment_services
  WHERE appointment_id = target_id;

  SELECT COALESCE(SUM(amount), 0) INTO paid
  FROM public.appointment_payments
  WHERE appointment_id = target_id;

  -- clamp paid if it exceeds new total
  IF paid > new_total THEN
    paid := new_total;
  END IF;

  IF paid <= 0 THEN
    new_status := 'unpaid';
  ELSIF new_total > 0 AND paid >= new_total THEN
    new_status := 'paid';
  ELSE
    new_status := 'partial';
  END IF;

  UPDATE public.appointments
    SET total_price   = new_total,
        paid_amount   = LEAST(paid_amount, new_total),
        payment_status = new_status
    WHERE id = target_id;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS recompute_appointment_total_ins ON public.appointment_services;
DROP TRIGGER IF EXISTS recompute_appointment_total_upd ON public.appointment_services;
DROP TRIGGER IF EXISTS recompute_appointment_total_del ON public.appointment_services;

CREATE TRIGGER recompute_appointment_total_ins
  AFTER INSERT ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();

CREATE TRIGGER recompute_appointment_total_upd
  AFTER UPDATE ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();

CREATE TRIGGER recompute_appointment_total_del
  AFTER DELETE ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();

-- Reapply payment trigger on payments table (idempotent)
DROP TRIGGER IF EXISTS recompute_appointment_payment_ins ON public.appointment_payments;
DROP TRIGGER IF EXISTS recompute_appointment_payment_upd ON public.appointment_payments;
DROP TRIGGER IF EXISTS recompute_appointment_payment_del ON public.appointment_payments;

CREATE TRIGGER recompute_appointment_payment_ins
  AFTER INSERT ON public.appointment_payments
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();

CREATE TRIGGER recompute_appointment_payment_upd
  AFTER UPDATE ON public.appointment_payments
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();

CREATE TRIGGER recompute_appointment_payment_del
  AFTER DELETE ON public.appointment_payments
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();

-- One-time: pull all existing appointments in sync
UPDATE public.appointments a
SET total_price = COALESCE((SELECT SUM(price) FROM public.appointment_services WHERE appointment_id = a.id), 0);

UPDATE public.appointments a
SET paid_amount = LEAST(a.paid_amount, a.total_price),
    payment_status = CASE
      WHEN COALESCE((SELECT SUM(amount) FROM public.appointment_payments WHERE appointment_id = a.id), 0) <= 0 THEN 'unpaid'
      WHEN a.total_price > 0
        AND COALESCE((SELECT SUM(amount) FROM public.appointment_payments WHERE appointment_id = a.id), 0) >= a.total_price
        THEN 'paid'
      ELSE 'partial'
    END;
