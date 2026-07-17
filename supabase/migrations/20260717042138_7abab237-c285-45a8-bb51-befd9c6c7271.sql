
CREATE TABLE public.service_usage_stats (
  service_id UUID PRIMARY KEY REFERENCES public.services(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_usage_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_usage_stats TO authenticated;
GRANT ALL ON public.service_usage_stats TO service_role;

ALTER TABLE public.service_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_stats_read_all"
  ON public.service_usage_stats FOR SELECT
  USING (true);

CREATE POLICY "usage_stats_write_auth"
  ON public.service_usage_stats FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER trg_service_usage_stats_updated_at
  BEFORE UPDATE ON public.service_usage_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
