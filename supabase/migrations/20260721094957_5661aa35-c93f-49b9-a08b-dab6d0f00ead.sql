
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['car_catalog_models','car_catalog_modifications','car_custom_services','service_usage_stats']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      -- drop existing policies
      FOR t IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
        NULL;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Explicit policy recreation
DO $$
DECLARE tbl TEXT; pol RECORD;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['car_catalog_models','car_catalog_modifications','car_custom_services','service_usage_stats']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;
      EXECUTE format('CREATE POLICY "Public full access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', tbl);
    END IF;
  END LOOP;
END $$;
