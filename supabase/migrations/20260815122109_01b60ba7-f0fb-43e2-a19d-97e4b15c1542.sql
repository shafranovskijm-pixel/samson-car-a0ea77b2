-- 1) Разовая чистка: платежи, превышающие стоимость записи
ALTER TABLE public.appointment_payments DISABLE TRIGGER trg_prevent_payment_overflow;

WITH ranked AS (
  SELECT p.id, p.appointment_id, p.amount, a.total_price,
         SUM(p.amount) OVER (PARTITION BY p.appointment_id ORDER BY p.paid_at, p.created_at
                             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running
  FROM public.appointment_payments p
  JOIN public.appointments a ON a.id = p.appointment_id
)
UPDATE public.appointment_payments t
   SET amount = GREATEST(0, r.amount - (r.running - r.total_price))
  FROM ranked r
 WHERE t.id = r.id AND r.running > r.total_price;

DELETE FROM public.appointment_payments WHERE amount <= 0;

ALTER TABLE public.appointment_payments ENABLE TRIGGER trg_prevent_payment_overflow;

-- 2) Пересчёт итога по услугам больше НЕ прячет деньги: paid = фактическая сумма платежей
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
  IF TG_OP = 'DELETE' THEN target_id := OLD.appointment_id; ELSE target_id := NEW.appointment_id; END IF;

  SELECT COALESCE(SUM(price), 0) INTO new_total
  FROM public.appointment_services WHERE appointment_id = target_id;

  SELECT COALESCE(SUM(amount), 0) INTO paid
  FROM public.appointment_payments WHERE appointment_id = target_id;

  IF paid <= 0 THEN
    new_status := 'unpaid';
  ELSIF new_total > 0 AND paid >= new_total THEN
    new_status := 'paid';
  ELSE
    new_status := 'partial';
  END IF;

  UPDATE public.appointments
     SET total_price = new_total, paid_amount = paid, payment_status = new_status
   WHERE id = target_id;

  RETURN NULL;
END;
$function$;

-- 3) Убираем дублирующиеся триггеры (оставляем по одному на событие)
DROP TRIGGER IF EXISTS recompute_appointment_total_del ON public.appointment_services;
DROP TRIGGER IF EXISTS recompute_appointment_total_ins ON public.appointment_services;
DROP TRIGGER IF EXISTS recompute_appointment_total_upd ON public.appointment_services;
DROP TRIGGER IF EXISTS trg_recompute_appt_total_del ON public.appointment_services;
DROP TRIGGER IF EXISTS trg_recompute_appt_total_ins ON public.appointment_services;
DROP TRIGGER IF EXISTS trg_recompute_appt_total_upd ON public.appointment_services;
DROP TRIGGER IF EXISTS trg_recompute_total ON public.appointment_services;

DROP TRIGGER IF EXISTS recompute_appointment_payment_del ON public.appointment_payments;
DROP TRIGGER IF EXISTS recompute_appointment_payment_ins ON public.appointment_payments;
DROP TRIGGER IF EXISTS recompute_appointment_payment_upd ON public.appointment_payments;
DROP TRIGGER IF EXISTS trg_recompute_appt_payment_del ON public.appointment_payments;
DROP TRIGGER IF EXISTS trg_recompute_appt_payment_ins ON public.appointment_payments;
DROP TRIGGER IF EXISTS trg_recompute_appt_payment_upd ON public.appointment_payments;
DROP TRIGGER IF EXISTS trg_recompute_payment ON public.appointment_payments;

-- 4) Синхронизируем денормализованные поля со фактами
UPDATE public.appointments a
   SET total_price = COALESCE(t.total, 0),
       paid_amount = COALESCE(p.paid, 0),
       payment_status = CASE
         WHEN COALESCE(p.paid, 0) <= 0 THEN 'unpaid'
         WHEN COALESCE(t.total, 0) > 0 AND COALESCE(p.paid, 0) >= COALESCE(t.total, 0) THEN 'paid'
         ELSE 'partial' END
  FROM (SELECT id FROM public.appointments) x
  LEFT JOIN LATERAL (SELECT SUM(price) total FROM public.appointment_services s WHERE s.appointment_id = x.id) t ON TRUE
  LEFT JOIN LATERAL (SELECT SUM(amount) paid FROM public.appointment_payments pp WHERE pp.appointment_id = x.id) p ON TRUE
 WHERE a.id = x.id;