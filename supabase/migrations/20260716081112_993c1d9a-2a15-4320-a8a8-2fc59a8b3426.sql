
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'regular';

CREATE TABLE IF NOT EXISTS public.client_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_comments TO anon, authenticated;
GRANT ALL ON public.client_comments TO service_role;

ALTER TABLE public.client_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access" ON public.client_comments
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS client_comments_client_id_idx
  ON public.client_comments(client_id);

CREATE TRIGGER trg_client_comments_updated_at
  BEFORE UPDATE ON public.client_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
