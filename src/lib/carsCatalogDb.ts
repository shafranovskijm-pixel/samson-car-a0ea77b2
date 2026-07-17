import { supabase } from "@/integrations/supabase/client";

export type DbModification = {
  id: string;
  model_id: string;
  year: number;
  raw: string;
  body_code: string | null;
  chassis_code: string | null;
  engine_code: string | null;
  displacement_cc: number | null;
  horsepower: number | null;
  fuel: string | null;
  hybrid: boolean;
  steering: string | null;
  note: string | null;
  source: string;
};

const throwIf = <T>(res: { data: T | null; error: unknown }): T => {
  if (res.error) throw res.error;
  return res.data as T;
};

/** Все модели марки (независимо от года). */
export const dbListModelsForBrand = async (brand: string) => {
  const { data, error } = await supabase
    .from("car_catalog_models")
    .select("id, brand_name, name")
    .ilike("brand_name", brand)
    .order("name");
  if (error) throw error;
  return (data ?? []) as { id: string; brand_name: string; name: string }[];
};

/** Годы, для которых есть модификации у марки. */
export const dbListYearsForBrand = async (brand: string): Promise<number[]> => {
  const models = await dbListModelsForBrand(brand);
  if (models.length === 0) return [];
  const ids = models.map((m) => m.id);
  const { data, error } = await supabase
    .from("car_catalog_modifications")
    .select("year")
    .in("model_id", ids);
  if (error) throw error;
  const set = new Set<number>();
  (data ?? []).forEach((r) => set.add((r as { year: number }).year));
  return Array.from(set).sort((a, b) => b - a);
};

/** Модели, у которых есть модификации в указанном году. */
export const dbListModelsForBrandYear = async (brand: string, year: number) => {
  const models = await dbListModelsForBrand(brand);
  if (models.length === 0) return [];
  const ids = models.map((m) => m.id);
  const { data, error } = await supabase
    .from("car_catalog_modifications")
    .select("model_id")
    .in("model_id", ids)
    .eq("year", year);
  if (error) throw error;
  const withYear = new Set((data ?? []).map((r) => (r as { model_id: string }).model_id));
  return models.filter((m) => withYear.has(m.id));
};

export const dbListModifications = async (
  brand: string,
  year: number,
  modelName: string,
): Promise<DbModification[]> => {
  const { data: models, error: mErr } = await supabase
    .from("car_catalog_models")
    .select("id")
    .ilike("brand_name", brand)
    .ilike("name", modelName)
    .limit(1);
  if (mErr) throw mErr;
  const modelId = models?.[0]?.id;
  if (!modelId) return [];
  const { data, error } = await supabase
    .from("car_catalog_modifications")
    .select("*")
    .eq("model_id", modelId)
    .eq("year", year)
    .order("displacement_cc", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbModification[];
};

/** Найти или создать модель. */
export const dbEnsureModel = async (brand: string, modelName: string): Promise<string> => {
  const existing = await supabase
    .from("car_catalog_models")
    .select("id")
    .ilike("brand_name", brand)
    .ilike("name", modelName)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;
  const ins = await supabase
    .from("car_catalog_models")
    .insert({ brand_name: brand, name: modelName })
    .select("id")
    .single();
  return throwIf(ins).id;
};

export type NewModificationInput = {
  brand: string;
  modelName: string;
  year: number;
  body_code?: string | null;
  engine_code?: string | null;
  displacement_cc?: number | null;
  horsepower?: number | null;
  fuel?: string | null;
  hybrid?: boolean;
  steering?: string | null;
  note?: string | null;
};

/** Создать модификацию (модель создастся при необходимости). */
export const dbAddModification = async (input: NewModificationInput): Promise<DbModification> => {
  const modelId = await dbEnsureModel(input.brand, input.modelName);
  const raw = [
    input.body_code ?? "",
    input.engine_code ?? "",
    input.displacement_cc ?? "",
    input.horsepower ?? "",
    input.fuel ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || `custom-${Date.now()}`;

  const payload = {
    model_id: modelId,
    year: input.year,
    raw,
    body_code: input.body_code || null,
    engine_code: input.engine_code || null,
    displacement_cc: input.displacement_cc ?? null,
    horsepower: input.horsepower ?? null,
    fuel: input.fuel || null,
    hybrid: !!input.hybrid,
    steering: input.steering || null,
    note: input.note || null,
    source: "user",
  };

  const { data, error } = await supabase
    .from("car_catalog_modifications")
    .upsert(payload, { onConflict: "model_id,year,raw" })
    .select("*")
    .single();
  if (error) throw error;
  return data as DbModification;
};
