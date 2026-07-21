import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CarCustomService = {
  id: string;
  brand_name: string;
  model_name: string;
  year: number;
  category: string;
  name: string;
  price: number;
  duration_minutes: number;
};

const keyOf = (brand: string, model: string, year: number) =>
  `calc:custom-services:${brand.toLowerCase()}|${model.toLowerCase()}|${year}`;

const readLocal = (k: string): CarCustomService[] => {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const writeLocal = (k: string, list: CarCustomService[]) => {
  try {
    localStorage.setItem(k, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

const sameServiceKey = (a: Pick<CarCustomService, "category" | "name">, b: { category: string; name: string }) =>
  a.category.trim().toLowerCase() === b.category.trim().toLowerCase() &&
  a.name.trim().toLowerCase() === b.name.trim().toLowerCase();

export const useCarCustomServices = (
  brand: string,
  model: string,
  year: number | null,
) => {
  const enabled = !!brand && !!model && year != null;
  const k = enabled ? keyOf(brand, model, year!) : "";
  const [items, setItems] = useState<CarCustomService[]>(
    enabled ? readLocal(k) : [],
  );

  // sync local when key changes
  useEffect(() => {
    setItems(enabled ? readLocal(k) : []);
  }, [k, enabled]);

  // fetch cloud + merge с локальным (оффлайн-запись не должна перетираться)
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("car_custom_services")
        .select("*")
        .ilike("brand_name", brand)
        .ilike("model_name", model)
        .eq("year", year!);
      if (error || cancelled) return;
      const cloud = (data ?? []) as CarCustomService[];
      setItems((prev) => {
        // Merge by id: cloud wins on conflicts, локальные (ещё не синхронизированные) сохраняются.
        const byId = new Map<string, CarCustomService>();
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
  }, [k, enabled, brand, model, year]);

  const add = useCallback(
    async (input: {
      category: string;
      name: string;
      price: number;
      duration_minutes: number;
    }) => {
      if (!enabled) return null;
      const nameNorm = input.name.trim().toLowerCase();
      const catNorm = input.category.trim().toLowerCase();
      let existing = items.find(
        (x) =>
          x.name.trim().toLowerCase() === nameNorm &&
          x.category.trim().toLowerCase() === catNorm,
      );
      const payload = {
        brand_name: brand,
        model_name: model,
        year: year!,
        category: input.category,
        name: input.name,
        price: input.price,
        duration_minutes: input.duration_minutes,
      };
      if (!existing) {
        const { data: dbExisting, error: lookupError } = await supabase
          .from("car_custom_services")
          .select("*")
          .ilike("brand_name", brand)
          .ilike("model_name", model)
          .eq("year", year!)
          .ilike("category", input.category.trim())
          .ilike("name", input.name.trim())
          .maybeSingle();
        if (lookupError) throw lookupError;
        existing = (dbExisting as CarCustomService | null) ?? undefined;
      }

      const query = existing
        ? supabase
            .from("car_custom_services")
            .update({
              category: input.category,
              name: input.name,
              price: input.price,
              duration_minutes: input.duration_minutes,
            })
            .eq("id", existing.id)
        : supabase
            .from("car_custom_services")
            .upsert(payload, {
              onConflict: "brand_name,model_name,year,category,name",
              ignoreDuplicates: false,
            });

      const { data, error } = await query.select("*").single();
      if (error) throw error;
      const row = data as CarCustomService;
      setItems((prev) => {
        const next = [
          ...prev.filter((x) => x.id !== row.id && !sameServiceKey(x, row)),
          row,
        ];
        writeLocal(k, next);
        return next;
      });
      return { row, wasUpdate: !!existing, previousPrice: existing?.price ?? null };
    },
    [enabled, brand, model, year, k, items],
  );


  const remove = useCallback(
    async (id: string) => {
      if (!enabled) return;
      // optimistic
      setItems((prev) => {
        const next = prev.filter((x) => x.id !== id);
        writeLocal(k, next);
        return next;
      });
      const { error } = await supabase.from("car_custom_services").delete().eq("id", id);
      if (error) throw error;
    },
    [enabled, k],
  );

  return { items, add, remove, enabled };
};
