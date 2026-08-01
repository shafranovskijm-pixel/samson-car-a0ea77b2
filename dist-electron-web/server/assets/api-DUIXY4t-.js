import { t as supabase } from "./client-HdjySNjs.js";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/lib/api.ts
var api_exports = /* @__PURE__ */ __exportAll({
	clearAppointmentPayments: () => clearAppointmentPayments,
	createAppointment: () => createAppointment,
	createAppointmentPayment: () => createAppointmentPayment,
	createBrand: () => createBrand,
	createCar: () => createCar,
	createCarModel: () => createCarModel,
	createClient: () => createClient,
	createClientComment: () => createClientComment,
	createExpense: () => createExpense,
	createMechanic: () => createMechanic,
	createMechanicAdvance: () => createMechanicAdvance,
	createMechanicShift: () => createMechanicShift,
	createService: () => createService,
	createServiceCategory: () => createServiceCategory,
	deleteAppointment: () => deleteAppointment,
	deleteAppointmentPayment: () => deleteAppointmentPayment,
	deleteBrand: () => deleteBrand,
	deleteCar: () => deleteCar,
	deleteCarModel: () => deleteCarModel,
	deleteClient: () => deleteClient,
	deleteClientComment: () => deleteClientComment,
	deleteExpense: () => deleteExpense,
	deleteMechanic: () => deleteMechanic,
	deleteMechanicAdvance: () => deleteMechanicAdvance,
	deleteMechanicShift: () => deleteMechanicShift,
	deleteService: () => deleteService,
	deleteServiceCategory: () => deleteServiceCategory,
	deleteServicePrice: () => deleteServicePrice,
	getAppointment: () => getAppointment,
	getPriceForBrand: () => getPriceForBrand,
	humanizeSupabaseError: () => humanizeSupabaseError,
	listAllClientComments: () => listAllClientComments,
	listAllMechanicShifts: () => listAllMechanicShifts,
	listAppointmentPayments: () => listAppointmentPayments,
	listAppointments: () => listAppointments,
	listAppointmentsByClient: () => listAppointmentsByClient,
	listBrands: () => listBrands,
	listCarModels: () => listCarModels,
	listCars: () => listCars,
	listClientComments: () => listClientComments,
	listClients: () => listClients,
	listExpenses: () => listExpenses,
	listMechanicAdvances: () => listMechanicAdvances,
	listMechanicPayouts: () => listMechanicPayouts,
	listMechanicServiceRates: () => listMechanicServiceRates,
	listMechanicShifts: () => listMechanicShifts,
	listMechanics: () => listMechanics,
	listPaymentsRange: () => listPaymentsRange,
	listPricesForBrand: () => listPricesForBrand,
	listServiceCategories: () => listServiceCategories,
	listServicePrices: () => listServicePrices,
	listServices: () => listServices,
	recalcMechanicPayouts: () => recalcMechanicPayouts,
	updateAppointment: () => updateAppointment,
	updateAppointmentStatus: () => updateAppointmentStatus,
	updateBrand: () => updateBrand,
	updateBrandLogo: () => updateBrandLogo,
	updateCar: () => updateCar,
	updateCarModel: () => updateCarModel,
	updateClient: () => updateClient,
	updateClientComment: () => updateClientComment,
	updateMechanic: () => updateMechanic,
	updateMechanicDefaultPayoutPercent: () => updateMechanicDefaultPayoutPercent,
	updateMechanicShift: () => updateMechanicShift,
	updateService: () => updateService,
	updateServiceCategory: () => updateServiceCategory,
	uploadCatalogImage: () => uploadCatalogImage,
	upsertMechanicServiceRate: () => upsertMechanicServiceRate,
	upsertServiceByCategoryName: () => upsertServiceByCategoryName,
	upsertServicePrice: () => upsertServicePrice
});
function humanizeSupabaseError(e) {
	const err = e;
	const code = err?.code ?? err?.status;
	const msg = String(err?.message ?? err ?? "");
	if (code === "23505" || /duplicate key|already exists/i.test(msg)) return "Такая услуга уже есть";
	if (/no unique or exclusion constraint matching the ON CONFLICT specification/i.test(msg)) return "Не удалось обновить уже сохранённую услугу. Обновите страницу и попробуйте ещё раз";
	if (code === "42501" || code === "PGRST301" || code === 401 || code === 403) return "Нет доступа для этого действия";
	if (/network|fetch|failed to fetch/i.test(msg)) return "Нет соединения. Проверьте интернет";
	return msg || "Не удалось выполнить действие";
}
var throwIf = (x) => {
	if (x.error) throw x.error;
	return x.data;
};
var anySb = supabase;
var normalizeCategoryKey = (value) => (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
var cleanCategoryName = (value) => {
	const clean = (value ?? "").trim().replace(/\s+/g, " ");
	return normalizeCategoryKey(clean) === normalizeCategoryKey("Прочие услуги") ? "Прочие услуги" : clean;
};
var cleanServiceName = (value) => value.trim().replace(/\s+/g, " ");
var listBrands = async () => throwIf(await supabase.from("brands").select("*").order("name"));
var createBrand = async (name) => throwIf(await supabase.from("brands").insert({ name }).select().single());
var updateBrand = async (id, name) => throwIf(await supabase.from("brands").update({ name }).eq("id", id).select().single());
var updateBrandLogo = async (id, logo_url) => throwIf(await supabase.from("brands").update({ logo_url }).eq("id", id).select().single());
var deleteBrand = async (id) => {
	const { error } = await supabase.from("brands").delete().eq("id", id);
	if (error) throw error;
};
var listServiceCategories = async () => throwIf(await supabase.from("service_categories").select("id, name, image_url, sort_order").order("sort_order").order("name"));
var createServiceCategory = async (input) => throwIf(await supabase.from("service_categories").insert({
	name: cleanCategoryName(input.name),
	image_url: input.image_url ?? null,
	sort_order: input.sort_order ?? 100
}).select().single());
var updateServiceCategory = async (id, input) => throwIf(await supabase.from("service_categories").update({
	...input,
	...input.name != null ? { name: cleanCategoryName(input.name) } : {}
}).eq("id", id).select().single());
var deleteServiceCategory = async (id, fallbackName = "Прочие услуги") => {
	const { data: category, error: categoryError } = await supabase.from("service_categories").select("name").eq("id", id).maybeSingle();
	if (categoryError) throw categoryError;
	const fallbackCategory = cleanCategoryName(fallbackName);
	const targetKey = normalizeCategoryKey(category?.name);
	const fallbackKey = normalizeCategoryKey(fallbackCategory);
	if (targetKey && targetKey !== fallbackKey) {
		const { data: rowsData, error: rowsError } = await supabase.from("services").select("id, category").is("deleted_at", null);
		if (rowsError) throw rowsError;
		const ids = (rowsData ?? []).filter((row) => normalizeCategoryKey(row.category) === targetKey).map((row) => row.id);
		for (let i = 0; i < ids.length; i += 100) {
			const chunk = ids.slice(i, i + 100);
			const { error: updateError } = await supabase.from("services").update({ category: fallbackCategory }).in("id", chunk);
			if (updateError) throw updateError;
		}
	}
	const { error } = await supabase.from("service_categories").delete().eq("id", id);
	if (error) throw error;
};
var uploadCatalogImage = async (file, prefix) => {
	const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
	const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
	const { error } = await supabase.storage.from("catalog-images").upload(path, file, {
		cacheControl: "3600",
		upsert: false,
		contentType: file.type
	});
	if (error) throw error;
	const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
	return data.publicUrl;
};
var listCarModels = async (brand_id) => {
	let q = supabase.from("car_models").select("*").order("name");
	if (brand_id) q = q.eq("brand_id", brand_id);
	return throwIf(await q);
};
var createCarModel = async (input) => throwIf(await supabase.from("car_models").insert(input).select().single());
var updateCarModel = async (id, input) => throwIf(await supabase.from("car_models").update(input).eq("id", id).select().single());
var deleteCarModel = async (id) => {
	const { error } = await supabase.from("car_models").delete().eq("id", id);
	if (error) throw error;
};
var listServices = async () => throwIf(await supabase.from("services").select("*").order("category").order("name"));
var createService = async (input) => throwIf(await supabase.from("services").insert(input).select().single());
var updateService = async (id, input) => throwIf(await supabase.from("services").update(input).eq("id", id).select().single());
var deleteService = async (id) => {
	const { error } = await supabase.from("services").delete().eq("id", id);
	if (error) throw error;
};
var upsertServiceByCategoryName = async (input) => {
	const category = cleanCategoryName(input.category);
	const name = cleanServiceName(input.name);
	const { data: matches, error: findErr } = await supabase.from("services").select("*").ilike("name", name).is("deleted_at", null);
	if (findErr) throw findErr;
	const existing = (matches ?? []).find((service) => normalizeCategoryKey(service.category) === normalizeCategoryKey(category) && cleanServiceName(service.name).toLocaleLowerCase("ru-RU") === name.toLocaleLowerCase("ru-RU"));
	if (existing) return existing;
	const { data, error } = await supabase.from("services").insert({
		category,
		name,
		base_price: input.price,
		duration_minutes: input.duration_minutes ?? 30
	}).select().single();
	if (error) throw error;
	return data;
};
var listServicePrices = async (serviceId) => throwIf(await supabase.from("service_prices").select("*").eq("service_id", serviceId));
var upsertServicePrice = async (service_id, brand_id, price) => throwIf(await supabase.from("service_prices").upsert({
	service_id,
	brand_id,
	price
}).select().single());
var deleteServicePrice = async (service_id, brand_id) => {
	const { error } = await supabase.from("service_prices").delete().eq("service_id", service_id).eq("brand_id", brand_id);
	if (error) throw error;
};
var getPriceForBrand = async (service_id, brand_id) => {
	if (!brand_id) return null;
	const { data } = await supabase.from("service_prices").select("price").eq("service_id", service_id).eq("brand_id", brand_id).maybeSingle();
	return data?.price ?? null;
};
var listPricesForBrand = async (brand_id) => {
	const { data, error } = await supabase.from("service_prices").select("service_id, price").eq("brand_id", brand_id);
	if (error) throw error;
	const map = {};
	(data ?? []).forEach((r) => map[r.service_id] = r.price);
	return map;
};
var listClients = async () => throwIf(await supabase.from("clients").select("*").order("full_name"));
var createClient = async (input) => throwIf(await supabase.from("clients").insert(input).select().single());
var updateClient = async (id, input) => throwIf(await supabase.from("clients").update(input).eq("id", id).select().single());
var deleteClient = async (id) => {
	const { error } = await supabase.from("clients").delete().eq("id", id);
	if (error) throw error;
};
var listCars = async () => throwIf(await supabase.from("cars").select("*").order("created_at", { ascending: false }));
var createCar = async (input) => throwIf(await supabase.from("cars").insert(input).select().single());
var updateCar = async (id, input) => throwIf(await supabase.from("cars").update(input).eq("id", id).select().single());
var deleteCar = async (id) => {
	const { error } = await supabase.from("cars").delete().eq("id", id);
	if (error) throw error;
};
var listMechanics = async () => throwIf(await supabase.from("mechanics").select("*").order("full_name"));
var createMechanic = async (input) => throwIf(await supabase.from("mechanics").insert(input).select().single());
var updateMechanic = async (id, input) => throwIf(await supabase.from("mechanics").update(input).eq("id", id).select().single());
var deleteMechanic = async (id) => {
	const { error } = await supabase.from("mechanics").delete().eq("id", id);
	if (error) throw error;
};
var APPT_SELECT = `
  *,
  car:cars(*, brand:brands(*), client:clients(*)),
  mechanic:mechanics(*),
  services:appointment_services(service_id, price, mechanic_payout, service:services(*))
`;
var listAppointments = async (from, to) => {
	let q = supabase.from("appointments").select(APPT_SELECT).order("starts_at");
	if (from) q = q.gte("starts_at", from.toISOString());
	if (to) q = q.lte("starts_at", to.toISOString());
	return throwIf(await q);
};
var getAppointment = async (id) => throwIf(await supabase.from("appointments").select(APPT_SELECT).eq("id", id).single());
var createAppointment = async (input) => {
	const { services, ...appt } = input;
	const created = throwIf(await supabase.from("appointments").insert(appt).select().single());
	if (services.length > 0) {
		const { error } = await supabase.from("appointment_services").insert(services.map((s) => ({
			...s,
			appointment_id: created.id
		})));
		if (error) throw error;
	}
	return created;
};
var updateAppointment = async (id, input) => {
	const { services, ...appt } = input;
	throwIf(await supabase.from("appointments").update(appt).eq("id", id).select().single());
	const { error: delErr } = await supabase.from("appointment_services").delete().eq("appointment_id", id);
	if (delErr) throw delErr;
	if (services.length > 0) {
		const { error } = await supabase.from("appointment_services").insert(services.map((s) => ({
			...s,
			appointment_id: id
		})));
		if (error) throw error;
	}
};
var deleteAppointment = async (id) => {
	const { error } = await supabase.from("appointments").delete().eq("id", id);
	if (error) throw error;
};
var updateAppointmentStatus = async (id, status) => {
	const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
	if (error) throw error;
};
var listAppointmentsByClient = async (client_id) => {
	const carsRes = await supabase.from("cars").select("id").eq("client_id", client_id);
	if (carsRes.error) throw carsRes.error;
	const ids = (carsRes.data ?? []).map((c) => c.id);
	if (ids.length === 0) return [];
	return throwIf(await supabase.from("appointments").select(APPT_SELECT).in("car_id", ids).order("starts_at", { ascending: false }));
};
var listClientComments = async (client_id) => {
	const { data, error } = await anySb.from("client_comments").select("*").eq("client_id", client_id).order("created_at", { ascending: false });
	if (error) throw error;
	return data ?? [];
};
var listAllClientComments = async () => {
	const { data, error } = await anySb.from("client_comments").select("*").order("created_at", { ascending: false });
	if (error) throw error;
	return data ?? [];
};
var createClientComment = async (client_id, body) => {
	const { data, error } = await anySb.from("client_comments").insert({
		client_id,
		body
	}).select().single();
	if (error) throw error;
	return data;
};
var updateClientComment = async (id, body) => {
	const { data, error } = await anySb.from("client_comments").update({ body }).eq("id", id).select().single();
	if (error) throw error;
	return data;
};
var deleteClientComment = async (id) => {
	const { error } = await anySb.from("client_comments").delete().eq("id", id);
	if (error) throw error;
};
var listMechanicServiceRates = async (mechanic_id) => {
	let q = supabase.from("mechanic_service_rates").select("*");
	if (mechanic_id) q = q.eq("mechanic_id", mechanic_id);
	return throwIf(await q);
};
var upsertMechanicServiceRate = async (mechanic_id, service_id, amount) => throwIf(await supabase.from("mechanic_service_rates").upsert({
	mechanic_id,
	service_id,
	amount
}, { onConflict: "mechanic_id,service_id" }).select().single());
var listMechanicShifts = async (mechanic_id) => throwIf(await supabase.from("mechanic_shifts").select("*").eq("mechanic_id", mechanic_id).order("starts_at", { ascending: false }));
var listAllMechanicShifts = async () => throwIf(await supabase.from("mechanic_shifts").select("*").order("starts_at", { ascending: true }));
var createMechanicShift = async (input) => throwIf(await supabase.from("mechanic_shifts").insert(input).select().single());
var updateMechanicShift = async (id, input) => throwIf(await supabase.from("mechanic_shifts").update(input).eq("id", id).select().single());
var deleteMechanicShift = async (id) => {
	const { error } = await supabase.from("mechanic_shifts").delete().eq("id", id);
	if (error) throw error;
};
var listMechanicPayouts = async (mechanic_id) => {
	const { data, error } = await supabase.from("appointment_services").select("appointment_id, service_id, price, mechanic_payout, service:services(name), appointment:appointments!inner(starts_at, status, mechanic_id, comment, car:cars(model, license_plate, brand:brands(name), client:clients(full_name)))").eq("appointment.mechanic_id", mechanic_id);
	if (error) throw error;
	return (data ?? []).map((r) => {
		const car = r.appointment?.car;
		const carLabel = [car?.brand?.name ?? "", car?.model ?? ""].filter(Boolean).join(" ") || null;
		return {
			appointment_id: r.appointment_id,
			service_id: r.service_id,
			price: Number(r.price),
			mechanic_payout: Number(r.mechanic_payout),
			starts_at: r.appointment?.starts_at ?? "",
			status: r.appointment?.status ?? "",
			service_name: r.service?.name ?? null,
			client_name: car?.client?.full_name ?? null,
			car_label: carLabel,
			license_plate: car?.license_plate ?? null,
			appointment_comment: r.appointment?.comment ?? null
		};
	});
};
var updateMechanicDefaultPayoutPercent = async (id, percent) => {
	const { error } = await anySb.from("mechanics").update({ default_payout_percent: percent }).eq("id", id);
	if (error) throw error;
};
/**
* Пересчитывает сохранённые суммы mechanic_payout в услугах мастера
* по актуальному проценту (индивидуальная ставка за услугу имеет приоритет).
*
* Безопасность бухгалтерии:
*  - opts.onlyFrom — ограничение по дате начала записи (закрытые месяцы не трогаем);
*  - opts.skipPaid — не трогать полностью оплаченные записи (закрытая касса).
*/
var recalcMechanicPayouts = async (mechanicId, percent, opts) => {
	let aq = anySb.from("appointments").select("id, payment_status").eq("mechanic_id", mechanicId).is("deleted_at", null);
	if (opts?.onlyFrom) aq = aq.gte("starts_at", opts.onlyFrom);
	let appts = throwIf(await aq) ?? [];
	if (opts?.skipPaid) appts = appts.filter((a) => a.payment_status !== "paid");
	if (!appts.length) return 0;
	const ids = appts.map((a) => a.id);
	const rates = await listMechanicServiceRates(mechanicId);
	const rateBySvc = new Map(rates.map((r) => [r.service_id, Number(r.amount ?? 0)]));
	const rows = throwIf(await anySb.from("appointment_services").select("appointment_id, service_id, price, mechanic_payout").in("appointment_id", ids)) ?? [];
	let changed = 0;
	for (const r of rows) {
		const override = rateBySvc.get(r.service_id);
		const next = override != null && override > 0 ? Math.round(override) : Math.round(Number(r.price ?? 0) * percent / 100);
		if (next === Math.round(Number(r.mechanic_payout ?? 0))) continue;
		const { error } = await anySb.from("appointment_services").update({ mechanic_payout: next }).eq("appointment_id", r.appointment_id).eq("service_id", r.service_id);
		if (error) throw error;
		changed += 1;
	}
	return changed;
};
var listExpenses = async (from, to) => {
	let q = anySb.from("expenses").select("*").order("spent_at", { ascending: false });
	if (from) q = q.gte("spent_at", from);
	if (to) q = q.lte("spent_at", to);
	const { data, error } = await q;
	if (error) throw error;
	return data ?? [];
};
var createExpense = async (input) => {
	const { data, error } = await anySb.from("expenses").insert(input).select().single();
	if (error) throw error;
	return data;
};
var deleteExpense = async (id) => {
	const { error } = await anySb.from("expenses").delete().eq("id", id);
	if (error) throw error;
};
var listMechanicAdvances = async (opts = {}) => {
	let q = anySb.from("mechanic_advances").select("*").order("paid_at", { ascending: false });
	if (opts.mechanic_id) q = q.eq("mechanic_id", opts.mechanic_id);
	if (opts.from) q = q.gte("paid_at", opts.from);
	if (opts.to) q = q.lte("paid_at", opts.to);
	const { data, error } = await q;
	if (error) throw error;
	return data ?? [];
};
var createMechanicAdvance = async (input) => {
	const { data, error } = await anySb.from("mechanic_advances").insert(input).select().single();
	if (error) throw error;
	return data;
};
var deleteMechanicAdvance = async (id) => {
	const { error } = await anySb.from("mechanic_advances").delete().eq("id", id);
	if (error) throw error;
};
var listAppointmentPayments = async (appointment_id) => {
	const { data, error } = await anySb.from("appointment_payments").select("*").eq("appointment_id", appointment_id).order("paid_at", { ascending: false });
	if (error) throw error;
	return data ?? [];
};
var createAppointmentPayment = async (input) => {
	const { data, error } = await anySb.from("appointment_payments").insert(input).select().single();
	if (error) throw error;
	return data;
};
var deleteAppointmentPayment = async (id) => {
	const { error } = await anySb.from("appointment_payments").delete().eq("id", id);
	if (error) throw error;
};
var clearAppointmentPayments = async (appointment_id) => {
	const { error } = await anySb.from("appointment_payments").delete().eq("appointment_id", appointment_id);
	if (error) throw error;
};
var listPaymentsRange = async (from, to) => {
	const { data, error } = await anySb.from("appointment_payments").select("*, appointment:appointments!inner(deleted_at)").gte("paid_at", from).lte("paid_at", to).is("appointment.deleted_at", null).order("paid_at", { ascending: false });
	if (error) throw error;
	return (data ?? []).map((p) => {
		const { appointment: _drop, ...rest } = p;
		return rest;
	});
};
//#endregion
export { listServices as $, getAppointment as A, listCars as B, deleteExpense as C, deleteService as D, deleteMechanicShift as E, listAppointmentPayments as F, listMechanicPayouts as G, listClients as H, listAppointments as I, listMechanics as J, listMechanicServiceRates as K, listAppointmentsByClient as L, humanizeSupabaseError as M, listAllClientComments as N, deleteServiceCategory as O, listAllMechanicShifts as P, listServicePrices as Q, listBrands as R, deleteClientComment as S, deleteMechanicAdvance as T, listExpenses as U, listClientComments as V, listMechanicAdvances as W, listPricesForBrand as X, listPaymentsRange as Y, listServiceCategories as Z, deleteAppointmentPayment as _, upsertServicePrice as _t, createBrand as a, updateCar as at, deleteCarModel as b, createClient as c, updateClientComment as ct, createMechanic as d, updateMechanicShift as dt, recalcMechanicPayouts as et, createMechanicAdvance as f, updateService as ft, deleteAppointment as g, upsertServiceByCategoryName as gt, createServiceCategory as h, upsertMechanicServiceRate as ht, createAppointmentPayment as i, updateBrandLogo as it, getPriceForBrand as j, deleteServicePrice as k, createClientComment as l, updateMechanic as lt, createService as m, uploadCatalogImage as mt, clearAppointmentPayments as n, updateAppointmentStatus as nt, createCar as o, updateCarModel as ot, createMechanicShift as p, updateServiceCategory as pt, listMechanicShifts as q, createAppointment as r, updateBrand as rt, createCarModel as s, updateClient as st, api_exports as t, updateAppointment as tt, createExpense as u, updateMechanicDefaultPayoutPercent as ut, deleteBrand as v, deleteMechanic as w, deleteClient as x, deleteCar as y, listCarModels as z };
