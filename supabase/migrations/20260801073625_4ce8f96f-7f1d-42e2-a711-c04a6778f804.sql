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
    SET total_price    = new_total,
        paid_amount    = paid,
        payment_status = new_status
    WHERE id = target_id;

  RETURN NULL;
END;
$function$;