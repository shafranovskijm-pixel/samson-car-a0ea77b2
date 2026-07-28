
-- 1. Cleanup: delete payments linked to deleted or missing appointments
DELETE FROM public.appointment_payments p
WHERE NOT EXISTS (
  SELECT 1 FROM public.appointments a
  WHERE a.id = p.appointment_id AND a.deleted_at IS NULL
);

-- 2. Cleanup: delete payments that exceed appointment total (overpayments)
DELETE FROM public.appointment_payments p
USING public.appointments a
WHERE p.appointment_id = a.id
  AND p.amount > a.total_price;

-- 3. Prevent future overpayments
CREATE OR REPLACE FUNCTION public.prevent_payment_overflow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  apt_total NUMERIC;
  apt_paid  NUMERIC;
  apt_deleted TIMESTAMPTZ;
BEGIN
  SELECT total_price, deleted_at INTO apt_total, apt_deleted
  FROM public.appointments WHERE id = NEW.appointment_id;

  IF apt_total IS NULL THEN
    RAISE EXCEPTION 'Платёж указывает на несуществующую запись';
  END IF;

  IF apt_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'Нельзя добавить платёж к удалённой записи';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO apt_paid
  FROM public.appointment_payments
  WHERE appointment_id = NEW.appointment_id
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF apt_paid + NEW.amount > apt_total THEN
    RAISE EXCEPTION 'Сумма платежей (%.2f) превышает стоимость записи (%.2f)', apt_paid + NEW.amount, apt_total;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_payment_overflow ON public.appointment_payments;
CREATE TRIGGER trg_prevent_payment_overflow
BEFORE INSERT OR UPDATE ON public.appointment_payments
FOR EACH ROW EXECUTE FUNCTION public.prevent_payment_overflow();

-- 4. Cascade delete payments when appointment is soft-deleted
CREATE OR REPLACE FUNCTION public.cleanup_payments_on_appointment_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
     OR TG_OP = 'DELETE' THEN
    DELETE FROM public.appointment_payments
    WHERE appointment_id = COALESCE(NEW.id, OLD.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_payments_soft_delete ON public.appointments;
CREATE TRIGGER trg_cleanup_payments_soft_delete
AFTER UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.cleanup_payments_on_appointment_delete();

-- 5. Ensure recompute triggers exist (idempotent) so statuses stay in sync
DROP TRIGGER IF EXISTS trg_recompute_payment ON public.appointment_payments;
CREATE TRIGGER trg_recompute_payment
AFTER INSERT OR UPDATE OR DELETE ON public.appointment_payments
FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();

DROP TRIGGER IF EXISTS trg_recompute_total ON public.appointment_services;
CREATE TRIGGER trg_recompute_total
AFTER INSERT OR UPDATE OR DELETE ON public.appointment_services
FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();

-- 6. Final resync of all appointments
UPDATE public.appointments a
SET
  total_price = COALESCE(s.total, 0),
  paid_amount = LEAST(COALESCE(p.paid, 0), COALESCE(s.total, 0)),
  payment_status = CASE
    WHEN COALESCE(p.paid, 0) <= 0 THEN 'unpaid'
    WHEN COALESCE(s.total, 0) > 0 AND COALESCE(p.paid, 0) >= COALESCE(s.total, 0) THEN 'paid'
    ELSE 'partial'
  END
FROM (SELECT appointment_id, SUM(price) AS total FROM public.appointment_services GROUP BY appointment_id) s
FULL JOIN (SELECT appointment_id, SUM(amount) AS paid FROM public.appointment_payments GROUP BY appointment_id) p
  ON s.appointment_id = p.appointment_id
WHERE a.id = COALESCE(s.appointment_id, p.appointment_id);
