import { t as supabase } from "./client-HdjySNjs.js";
import { useCallback, useEffect, useState } from "react";
//#region src/hooks/useServiceUsage.ts
var LS_KEY = "calc:service-usage";
var readLocal$1 = () => {
	try {
		const raw = localStorage.getItem(LS_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
};
var writeLocal$1 = (m) => {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(m));
	} catch {}
};
var mergeMax = (a, b) => {
	const out = { ...a };
	for (const [k, v] of Object.entries(b)) {
		const prev = out[k];
		if (!prev) out[k] = { ...v };
		else out[k] = {
			count: Math.max(prev.count, v.count),
			lastAt: prev.lastAt > v.lastAt ? prev.lastAt : v.lastAt
		};
	}
	return out;
};
function useServiceUsage() {
	const [usage, setUsage] = useState(() => typeof window !== "undefined" ? readLocal$1() : {});
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data, error } = await supabase.from("service_usage_stats").select("service_id, count, last_used_at");
			if (cancelled || error || !data) return;
			const cloud = {};
			data.forEach((r) => {
				cloud[r.service_id] = {
					count: r.count,
					lastAt: r.last_used_at
				};
			});
			setUsage((prev) => {
				const merged = mergeMax(prev, cloud);
				writeLocal$1(merged);
				return merged;
			});
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	return {
		usage,
		bump: useCallback((serviceIds) => {
			if (!serviceIds.length) return;
			const nowIso = (/* @__PURE__ */ new Date()).toISOString();
			setUsage((prev) => {
				const next = { ...prev };
				serviceIds.forEach((id) => {
					next[id] = {
						count: (next[id]?.count ?? 0) + 1,
						lastAt: nowIso
					};
				});
				writeLocal$1(next);
				(async () => {
					for (const id of serviceIds) {
						if (id.startsWith("custom:")) continue;
						const c = next[id].count;
						await supabase.from("service_usage_stats").upsert({
							service_id: id,
							count: c,
							last_used_at: nowIso
						}, { onConflict: "service_id" });
					}
				})().catch(() => {});
				return next;
			});
		}, []),
		topServiceIds: useCallback((limit = 6) => {
			const now = Date.now();
			const scored = Object.entries(usage).map(([id, v]) => {
				const days = Math.max(0, (now - new Date(v.lastAt).getTime()) / 864e5);
				return {
					id,
					score: v.count * Math.exp(-days / 60)
				};
			});
			scored.sort((a, b) => b.score - a.score);
			return scored.slice(0, limit).map((s) => s.id);
		}, [usage])
	};
}
//#endregion
//#region src/hooks/useCarCustomServices.ts
var keyOf = (brand, model, year) => `calc:custom-services:${brand.toLowerCase()}|${model.toLowerCase()}|${year}`;
var readLocal = (k) => {
	try {
		const raw = localStorage.getItem(k);
		if (!raw) return [];
		const arr = JSON.parse(raw);
		return Array.isArray(arr) ? arr : [];
	} catch {
		return [];
	}
};
var writeLocal = (k, list) => {
	try {
		localStorage.setItem(k, JSON.stringify(list));
	} catch {}
};
var sameServiceKey = (a, b) => a.category.trim().toLowerCase() === b.category.trim().toLowerCase() && a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
var useCarCustomServices = (brand, model, year) => {
	const enabled = !!brand && !!model && year != null;
	const k = enabled ? keyOf(brand, model, year) : "";
	const [items, setItems] = useState(enabled ? readLocal(k) : []);
	useEffect(() => {
		setItems(enabled ? readLocal(k) : []);
	}, [k, enabled]);
	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		(async () => {
			const { data, error } = await supabase.from("car_custom_services").select("*").ilike("brand_name", brand).ilike("model_name", model).eq("year", year);
			if (error || cancelled) return;
			const cloud = data ?? [];
			setItems((prev) => {
				const byId = /* @__PURE__ */ new Map();
				prev.forEach((x) => byId.set(x.id, x));
				cloud.forEach((x) => byId.set(x.id, x));
				const merged = Array.from(byId.values());
				writeLocal(k, merged);
				return merged;
			});
		})();
		return () => {
			cancelled = true;
		};
	}, [
		k,
		enabled,
		brand,
		model,
		year
	]);
	return {
		items,
		add: useCallback(async (input) => {
			if (!enabled) return null;
			const nameNorm = input.name.trim().toLowerCase();
			const catNorm = input.category.trim().toLowerCase();
			let existing = items.find((x) => x.name.trim().toLowerCase() === nameNorm && x.category.trim().toLowerCase() === catNorm);
			const payload = {
				brand_name: brand,
				model_name: model,
				year,
				category: input.category,
				name: input.name,
				price: input.price,
				duration_minutes: input.duration_minutes
			};
			if (!existing) {
				const { data: dbExisting, error: lookupError } = await supabase.from("car_custom_services").select("*").ilike("brand_name", brand).ilike("model_name", model).eq("year", year).ilike("category", input.category.trim()).ilike("name", input.name.trim()).maybeSingle();
				if (lookupError) throw lookupError;
				existing = dbExisting ?? void 0;
			}
			const { data, error } = await (existing ? supabase.from("car_custom_services").update({
				category: input.category,
				name: input.name,
				price: input.price,
				duration_minutes: input.duration_minutes
			}).eq("id", existing.id) : supabase.from("car_custom_services").upsert(payload, {
				onConflict: "brand_name,model_name,year,category,name",
				ignoreDuplicates: false
			})).select("*").single();
			if (error) throw error;
			const row = data;
			setItems((prev) => {
				const next = [...prev.filter((x) => x.id !== row.id && !sameServiceKey(x, row)), row];
				writeLocal(k, next);
				return next;
			});
			return {
				row,
				wasUpdate: !!existing,
				previousPrice: existing?.price ?? null
			};
		}, [
			enabled,
			brand,
			model,
			year,
			k,
			items
		]),
		remove: useCallback(async (id) => {
			if (!enabled) return;
			setItems((prev) => {
				const next = prev.filter((x) => x.id !== id);
				writeLocal(k, next);
				return next;
			});
			const { error } = await supabase.from("car_custom_services").delete().eq("id", id);
			if (error) throw error;
		}, [enabled, k]),
		enabled
	};
};
//#endregion
export { useServiceUsage as n, useCarCustomServices as t };
