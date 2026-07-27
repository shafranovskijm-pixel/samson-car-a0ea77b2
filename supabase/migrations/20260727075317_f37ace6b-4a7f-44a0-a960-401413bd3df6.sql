DROP POLICY IF EXISTS "service_categories write for authenticated" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories read for all" ON public.service_categories;
CREATE POLICY "Public full access" ON public.service_categories FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO anon, authenticated;