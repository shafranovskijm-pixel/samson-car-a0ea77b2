CREATE TABLE public.gym_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  percent numeric NOT NULL DEFAULT 80,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_trainers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_trainers TO anon;
GRANT ALL ON public.gym_trainers TO service_role;
ALTER TABLE public.gym_trainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.gym_trainers FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_gym_trainers_updated_at BEFORE UPDATE ON public.gym_trainers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gym_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_clients TO anon;
GRANT ALL ON public.gym_clients TO service_role;
ALTER TABLE public.gym_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.gym_clients FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_gym_clients_updated_at BEFORE UPDATE ON public.gym_clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gym_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  trainer_id uuid REFERENCES public.gym_trainers(id),
  client_id uuid REFERENCES public.gym_clients(id),
  client_name text NOT NULL DEFAULT '',
  package text NOT NULL DEFAULT '1',
  amount numeric NOT NULL DEFAULT 0,
  trainer_percent numeric NOT NULL DEFAULT 80,
  paid boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_entries TO anon;
GRANT ALL ON public.gym_entries TO service_role;
ALTER TABLE public.gym_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.gym_entries FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_gym_entries_updated_at BEFORE UPDATE ON public.gym_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_gym_entries_date ON public.gym_entries (entry_date);