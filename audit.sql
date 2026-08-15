-- 1. total_price mismatch
WITH service_totals AS (
    SELECT appointment_id, SUM(price) as calc_total
    FROM appointment_services
    GROUP BY appointment_id
)
SELECT 
    '1. total_price != sum(services)' as check_name,
    COUNT(*) as count,
    ARRAY_AGG(id::text) as examples
FROM (
    SELECT a.id
    FROM appointments a
    LEFT JOIN service_totals st ON a.id = st.appointment_id
    WHERE COALESCE(a.total_price, 0) != COALESCE(st.calc_total, 0)
    AND a.deleted_at IS NULL
    LIMIT 5
) t, (
    SELECT COUNT(*)
    FROM appointments a
    LEFT JOIN service_totals st ON a.id = st.appointment_id
    WHERE COALESCE(a.total_price, 0) != COALESCE(st.calc_total, 0)
    AND a.deleted_at IS NULL
) c;

-- 2. paid_amount mismatch
WITH payment_totals AS (
    SELECT appointment_id, SUM(amount) as calc_paid
    FROM appointment_payments
    GROUP BY appointment_id
)
SELECT 
    '2. paid_amount != sum(payments)' as check_name,
    COUNT(*) as count,
    ARRAY_AGG(id::text) as examples
FROM (
    SELECT a.id
    FROM appointments a
    LEFT JOIN payment_totals pt ON a.id = pt.appointment_id
    WHERE COALESCE(a.paid_amount, 0) != COALESCE(pt.calc_paid, 0)
    AND a.deleted_at IS NULL
    LIMIT 5
) t, (
    SELECT COUNT(*)
    FROM appointments a
    LEFT JOIN payment_totals pt ON a.id = pt.appointment_id
    WHERE COALESCE(a.paid_amount, 0) != COALESCE(pt.calc_paid, 0)
    AND a.deleted_at IS NULL
) c;

-- 3. payment_status mismatch
SELECT 
    '3. payment_status mismatch' as check_name,
    COUNT(*) as count,
    ARRAY_AGG(id::text) as examples
FROM (
    SELECT id
    FROM appointments
    WHERE deleted_at IS NULL AND (
        (payment_status = 'paid' AND paid_amount < total_price) OR
        (payment_status = 'unpaid' AND paid_amount > 0) OR
        (payment_status = 'partial' AND (paid_amount = 0 OR paid_amount >= total_price))
    )
    LIMIT 5
) t, (
    SELECT COUNT(*)
    FROM appointments
    WHERE deleted_at IS NULL AND (
        (payment_status = 'paid' AND paid_amount < total_price) OR
        (payment_status = 'unpaid' AND paid_amount > 0) OR
        (payment_status = 'partial' AND (paid_amount = 0 OR paid_amount >= total_price))
    )
) c;

-- 4. Orphan payments
SELECT 
    '4. Orphan payments' as check_name,
    COUNT(*) as count,
    ARRAY_AGG(id::text) as examples
FROM (
    SELECT ap.id
    FROM appointment_payments ap
    JOIN appointments a ON ap.appointment_id = a.id
    WHERE a.deleted_at IS NOT NULL
    LIMIT 5
) t, (
    SELECT COUNT(*)
    FROM appointment_payments ap
    JOIN appointments a ON ap.appointment_id = a.id
    WHERE a.deleted_at IS NOT NULL
) c;

-- 5. Payout is 0 but price > 0
SELECT 
    '5. Payout=0 when price>0' as check_name,
    COUNT(*) as count,
    ARRAY_AGG(id::text) as examples
FROM (
    SELECT (appointment_id || ':' || service_id) as id
    FROM appointment_services
    WHERE price > 0 AND mechanic_payout = 0
    LIMIT 5
) t, (
    SELECT COUNT(*)
    FROM appointment_services
    WHERE price > 0 AND mechanic_payout = 0
) c;

-- 7. paid_amount > total_price
SELECT 
    '7. paid_amount > total_price' as check_name,
    COUNT(*) as count,
    ARRAY_AGG(id::text) as examples
FROM (
    SELECT id
    FROM appointments
    WHERE paid_amount > total_price AND deleted_at IS NULL
    LIMIT 5
) t, (
    SELECT COUNT(*)
    FROM appointments
    WHERE paid_amount > total_price AND deleted_at IS NULL
) c;

-- 6. Payout percent mismatch (detailed)
SELECT 
    m.full_name,
    TO_CHAR(a.starts_at AT TIME ZONE 'Asia/Vladivostok', 'YYYY-MM') as month,
    COUNT(*) as count,
    ARRAY_AGG(a.id::text) as example_appointment_ids
FROM appointment_services as ASV
JOIN appointments a ON ASV.appointment_id = a.id
JOIN mechanics m ON a.mechanic_id = m.id
WHERE ASV.price > 0 
  AND ABS((ASV.mechanic_payout::numeric / ASV.price * 100) - m.default_payout_percent) > 0.01
GROUP BY 1, 2
ORDER BY 2 DESC, 1;
