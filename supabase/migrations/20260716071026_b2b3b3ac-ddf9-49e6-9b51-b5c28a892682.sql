ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS clients_is_archived_idx ON public.clients (is_archived);