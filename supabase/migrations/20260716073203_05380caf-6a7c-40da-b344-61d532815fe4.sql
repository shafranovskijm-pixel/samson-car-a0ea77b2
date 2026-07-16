DROP POLICY IF EXISTS "authenticated manages mechanic_shifts" ON public.mechanic_shifts;
CREATE POLICY "Public full access" ON public.mechanic_shifts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated manages mechanic_service_rates" ON public.mechanic_service_rates;
CREATE POLICY "Public full access" ON public.mechanic_service_rates FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated can manage client_reminders" ON public.client_reminders;
CREATE POLICY "Public full access" ON public.client_reminders FOR ALL TO public USING (true) WITH CHECK (true);