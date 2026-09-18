import { supabase } from "@/integrations/supabase/client";

export type GymTrainer = {
  id: string;
  name: string;
  sort_order: number;
  percent: number;
  deleted_at: string | null;
};

export type GymClient = {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  deleted_at: string | null;
};

export type GymEntry = {
  id: string;
  entry_date: string;
  trainer_id: string | null;
  client_id: string | null;
  client_name: string;
  package: string;
  amount: number;
  trainer_percent: number;
  paid: boolean;
  note: string | null;
};

const throwIf = <T,>(x: { data: T | null; error: unknown }): T => {
  if (x.error) throw x.error;
  return x.data as T;
};

export async function listGymTrainers(): Promise<GymTrainer[]> {
  return throwIf(
    await supabase
      .from("gym_trainers")
      .select("id,name,sort_order,percent,deleted_at")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ) as GymTrainer[];
}

export async function createGymTrainer(name: string, percent = 80): Promise<GymTrainer> {
  return throwIf(
    await supabase
      .from("gym_trainers")
      .insert({ name, percent, sort_order: 900 })
      .select("id,name,sort_order,percent,deleted_at")
      .single(),
  ) as GymTrainer;
}

export async function updateGymTrainer(id: string, patch: Partial<GymTrainer>) {
  const r = await supabase.from("gym_trainers").update(patch).eq("id", id);
  if (r.error) throw r.error;
}

export async function deleteGymTrainer(id: string) {
  const r = await supabase.from("gym_trainers").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (r.error) throw r.error;
}

export async function listGymClients(): Promise<GymClient[]> {
  return throwIf(
    await supabase
      .from("gym_clients")
      .select("id,name,phone,note,deleted_at")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  ) as GymClient[];
}

export async function createGymClient(name: string, phone?: string): Promise<GymClient> {
  return throwIf(
    await supabase
      .from("gym_clients")
      .insert({ name, phone: phone || null })
      .select("id,name,phone,note,deleted_at")
      .single(),
  ) as GymClient;
}

export async function deleteGymClient(id: string) {
  const r = await supabase.from("gym_clients").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (r.error) throw r.error;
}

export async function listGymEntries(fromDate: string, toDate: string): Promise<GymEntry[]> {
  return throwIf(
    await supabase
      .from("gym_entries")
      .select("id,entry_date,trainer_id,client_id,client_name,package,amount,trainer_percent,paid,note")
      .gte("entry_date", fromDate)
      .lte("entry_date", toDate)
      .order("entry_date", { ascending: true }),
  ) as GymEntry[];
}

export async function createGymEntry(input: Omit<GymEntry, "id">): Promise<GymEntry> {
  return throwIf(
    await supabase
      .from("gym_entries")
      .insert(input)
      .select("id,entry_date,trainer_id,client_id,client_name,package,amount,trainer_percent,paid,note")
      .single(),
  ) as GymEntry;
}

export async function updateGymEntry(id: string, patch: Partial<GymEntry>) {
  const r = await supabase.from("gym_entries").update(patch).eq("id", id);
  if (r.error) throw r.error;
}

export async function deleteGymEntry(id: string) {
  const r = await supabase.from("gym_entries").delete().eq("id", id);
  if (r.error) throw r.error;
}
