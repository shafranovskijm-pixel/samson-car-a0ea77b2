import { supabase } from "@/integrations/supabase/client";

export type GymTrainer = {
  id: string;
  name: string;
  sort_order: number;
  percent: number;
  deleted_at: string | null;
  login: string | null;
  password: string | null;
};

export type GymPayout = {
  id: string;
  trainer_id: string;
  amount: number;
  paid_at: string;
  period_from: string | null;
  period_to: string | null;
  status: string;
  sent_at: string;
  confirmed_at: string | null;
  note: string | null;
};

const TRAINER_COLS = "id,name,sort_order,percent,deleted_at,login,password";
const PAYOUT_COLS =
  "id,trainer_id,amount,paid_at,period_from,period_to,status,sent_at,confirmed_at,note";

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
  sessions_total: number;
  sessions_used: number;
};

export type GymExpense = {
  id: string;
  expense_date: string;
  title: string;
  amount: number;
  note: string | null;
};

const ENTRY_COLS =
  "id,entry_date,trainer_id,client_id,client_name,package,amount,trainer_percent,paid,note,sessions_total,sessions_used";
const EXPENSE_COLS = "id,expense_date,title,amount,note";

const throwIf = <T,>(x: { data: T | null; error: unknown }): T => {
  if (x.error) throw x.error;
  return x.data as T;
};

export async function listGymTrainers(): Promise<GymTrainer[]> {
  return throwIf(
    await supabase
      .from("gym_trainers")
      .select(TRAINER_COLS)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ) as GymTrainer[];
}

export async function createGymTrainer(name: string, percent = 80): Promise<GymTrainer> {
  return throwIf(
    await supabase
      .from("gym_trainers")
      .insert({ name, percent, sort_order: 900 })
      .select(TRAINER_COLS)
      .single(),
  ) as GymTrainer;
}

/** Вход тренера по личному логину/паролю. */
export async function findTrainerByCredentials(
  login: string,
  password: string,
): Promise<GymTrainer | null> {
  const r = await supabase
    .from("gym_trainers")
    .select(TRAINER_COLS)
    .is("deleted_at", null)
    .ilike("login", login.trim())
    .limit(1);
  if (r.error) throw r.error;
  const t = (r.data ?? [])[0] as GymTrainer | undefined;
  if (!t || !t.password || t.password !== password) return null;
  return t;
}

export async function getGymTrainer(id: string): Promise<GymTrainer | null> {
  const r = await supabase.from("gym_trainers").select(TRAINER_COLS).eq("id", id).maybeSingle();
  if (r.error) throw r.error;
  return (r.data as GymTrainer) ?? null;
}

export async function listGymPayouts(trainerId?: string): Promise<GymPayout[]> {
  let q = supabase.from("gym_payouts").select(PAYOUT_COLS).order("paid_at", { ascending: false });
  if (trainerId) q = q.eq("trainer_id", trainerId);
  const r = await q;
  if (r.error) throw r.error;
  return (r.data ?? []) as GymPayout[];
}

export async function createGymPayout(input: {
  trainer_id: string;
  amount: number;
  paid_at: string;
  period_from?: string | null;
  period_to?: string | null;
  note?: string | null;
}): Promise<GymPayout> {
  return throwIf(
    await supabase
      .from("gym_payouts")
      .insert({ ...input, status: "sent" })
      .select(PAYOUT_COLS)
      .single(),
  ) as GymPayout;
}

export async function confirmGymPayout(id: string) {
  const r = await supabase
    .from("gym_payouts")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id);
  if (r.error) throw r.error;
}

export async function deleteGymPayout(id: string) {
  const r = await supabase.from("gym_payouts").delete().eq("id", id);
  if (r.error) throw r.error;
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

/** Все занятия тренера за всё время (для счёта тренера). */
export async function listTrainerEntries(trainerId: string): Promise<GymEntry[]> {
  return throwIf(
    await supabase
      .from("gym_entries")
      .select("id,entry_date,trainer_id,client_id,client_name,package,amount,trainer_percent,paid,note")
      .eq("trainer_id", trainerId)
      .order("entry_date", { ascending: false }),
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
