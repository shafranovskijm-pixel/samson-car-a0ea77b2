ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_payroll boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.expenses.is_payroll IS
  'true — расход является выплатой зарплаты/аванса мастеру. Не учитывается в прибыли повторно.';