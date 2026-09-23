CREATE TABLE public.gym_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.gym_entries(id) ON DELETE CASCADE,
  trainer_id uuid,
  visit_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  amount numeric NOT NULL DEFAULT 0
);

CREATE INDEX gym_visits_entry_idx ON public.gym_visits(entry_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_visits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_visits TO anon;
GRANT ALL ON public.gym_visits TO service_role;

ALTER TABLE public.gym_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_visits readable" ON public.gym_visits FOR SELECT USING (true);
CREATE POLICY "gym_visits insertable" ON public.gym_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "gym_visits updatable" ON public.gym_visits FOR UPDATE USING (true);
CREATE POLICY "gym_visits deletable" ON public.gym_visits FOR DELETE USING (true);