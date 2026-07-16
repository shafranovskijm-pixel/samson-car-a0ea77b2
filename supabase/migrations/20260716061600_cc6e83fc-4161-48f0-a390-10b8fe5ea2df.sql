CREATE TABLE public.client_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  interval_kind TEXT NOT NULL DEFAULT 'custom' CHECK (interval_kind IN ('day','week','month','half_year','year','custom')),
  repeat BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_reminders TO authenticated;
GRANT ALL ON public.client_reminders TO service_role;

ALTER TABLE public.client_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can manage client_reminders"
  ON public.client_reminders FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX client_reminders_client_id_idx ON public.client_reminders(client_id);
CREATE INDEX client_reminders_remind_at_idx ON public.client_reminders(remind_at);

CREATE TRIGGER set_client_reminders_updated_at
  BEFORE UPDATE ON public.client_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();