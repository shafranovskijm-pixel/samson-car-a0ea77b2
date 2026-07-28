
-- 1. Триггеры
DROP TRIGGER IF EXISTS trg_recompute_appt_payment_ins ON public.appointment_payments;
DROP TRIGGER IF EXISTS trg_recompute_appt_payment_upd ON public.appointment_payments;
DROP TRIGGER IF EXISTS trg_recompute_appt_payment_del ON public.appointment_payments;
CREATE TRIGGER trg_recompute_appt_payment_ins
  AFTER INSERT ON public.appointment_payments
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();
CREATE TRIGGER trg_recompute_appt_payment_upd
  AFTER UPDATE ON public.appointment_payments
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();
CREATE TRIGGER trg_recompute_appt_payment_del
  AFTER DELETE ON public.appointment_payments
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_payment();

DROP TRIGGER IF EXISTS trg_recompute_appt_total_ins ON public.appointment_services;
DROP TRIGGER IF EXISTS trg_recompute_appt_total_upd ON public.appointment_services;
DROP TRIGGER IF EXISTS trg_recompute_appt_total_del ON public.appointment_services;
CREATE TRIGGER trg_recompute_appt_total_ins
  AFTER INSERT ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();
CREATE TRIGGER trg_recompute_appt_total_upd
  AFTER UPDATE ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();
CREATE TRIGGER trg_recompute_appt_total_del
  AFTER DELETE ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();

-- 2. Разовая синхронизация всех записей
WITH sums AS (
  SELECT a.id,
    COALESCE((SELECT SUM(price) FROM public.appointment_services s WHERE s.appointment_id = a.id), 0) AS total_sum,
    COALESCE((SELECT SUM(amount) FROM public.appointment_payments p WHERE p.appointment_id = a.id), 0) AS paid_sum
  FROM public.appointments a
)
UPDATE public.appointments a
SET total_price = s.total_sum,
    paid_amount = s.paid_sum,
    payment_status = CASE
      WHEN s.paid_sum <= 0 THEN 'unpaid'
      WHEN s.total_sum > 0 AND s.paid_sum >= s.total_sum THEN 'paid'
      ELSE 'partial'
    END
FROM sums s
WHERE a.id = s.id;
