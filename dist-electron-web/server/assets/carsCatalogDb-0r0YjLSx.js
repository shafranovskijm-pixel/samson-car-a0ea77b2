import { t as supabase } from "./client-HdjySNjs.js";
//#region src/lib/carsCatalogDb.ts
var throwIf = (res) => {
	if (res.error) throw res.error;
	return res.data;
};
/** Все модели марки (независимо от года). */
var dbListModelsForBrand = async (brand) => {
	const { data, error } = await supabase.from("car_catalog_models").select("id, brand_name, name").ilike("brand_name", brand).order("name");
	if (error) throw error;
	return data ?? [];
};
/** Годы, для которых есть модификации у марки. */
var dbListYearsForBrand = async (brand) => {
	const models = await dbListModelsForBrand(brand);
	if (models.length === 0) return [];
	const ids = models.map((m) => m.id);
	const { data, error } = await supabase.from("car_catalog_modifications").select("year").in("model_id", ids);
	if (error) throw error;
	const set = /* @__PURE__ */ new Set();
	(data ?? []).forEach((r) => set.add(r.year));
	return Array.from(set).sort((a, b) => b - a);
};
/** Модели, у которых есть модификации в указанном году. */
var dbListModelsForBrandYear = async (brand, year) => {
	const models = await dbListModelsForBrand(brand);
	if (models.length === 0) return [];
	const ids = models.map((m) => m.id);
	const { data, error } = await supabase.from("car_catalog_modifications").select("model_id").in("model_id", ids).eq("year", year);
	if (error) throw error;
	const withYear = new Set((data ?? []).map((r) => r.model_id));
	return models.filter((m) => withYear.has(m.id));
};
var dbListModifications = async (brand, year, modelName) => {
	const { data: models, error: mErr } = await supabase.from("car_catalog_models").select("id").ilike("brand_name", brand).ilike("name", modelName).limit(1);
	if (mErr) throw mErr;
	const modelId = models?.[0]?.id;
	if (!modelId) return [];
	const { data, error } = await supabase.from("car_catalog_modifications").select("*").eq("model_id", modelId).eq("year", year).order("displacement_cc", { ascending: true });
	if (error) throw error;
	return data ?? [];
};
/** Найти или создать модель. */
var dbEnsureModel = async (brand, modelName) => {
	const existing = await supabase.from("car_catalog_models").select("id").ilike("brand_name", brand).ilike("name", modelName).maybeSingle();
	if (existing.error) throw existing.error;
	if (existing.data?.id) return existing.data.id;
	return throwIf(await supabase.from("car_catalog_models").insert({
		brand_name: brand,
		name: modelName
	}).select("id").single()).id;
};
/** Создать модификацию (модель создастся при необходимости). */
var dbAddModification = async (input) => {
	const modelId = await dbEnsureModel(input.brand, input.modelName);
	const raw = [
		input.body_code ?? "",
		input.engine_code ?? "",
		input.displacement_cc ?? "",
		input.horsepower ?? "",
		input.fuel ?? ""
	].filter(Boolean).join(" ").trim() || `custom-${Date.now()}`;
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
		source: "user"
	};
	const { data, error } = await supabase.from("car_catalog_modifications").upsert(payload, { onConflict: "model_id,year,raw" }).select("*").single();
	if (error) throw error;
	return data;
};
/** Удалить модификацию по id. */
var dbDeleteModification = async (id) => {
	const { error } = await supabase.from("car_catalog_modifications").delete().eq("id", id);
	if (error) throw error;
};
//#endregion
export { dbListModifications as a, dbListModelsForBrandYear as i, dbDeleteModification as n, dbListYearsForBrand as o, dbEnsureModel as r, dbAddModification as t };
