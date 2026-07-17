import { useCallback, useEffect, useState } from "react";
import {
  deleteServicePrice,
  listPricesForBrand,
  upsertServicePrice,
} from "@/lib/api";

const LS_KEY = "calc:price-overrides";

type LocalMap = Record<string, number>; // key: "{brandId}:{serviceId}"

const readLocal = (): LocalMap => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as LocalMap) : {};
  } catch {
    return {};
  }
};

const writeLocal = (m: LocalMap) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

const localFor = (brandId: string | null): Record<string, number> => {
  if (!brandId) return {};
  const all = readLocal();
  const out: Record<string, number> = {};
  const prefix = `${brandId}:`;
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  }
  return out;
};

/**
 * Возвращает объединённую карту `service_id -> price` для указанной марки.
 * Облако (service_prices) — источник истины при онлайне; local — фолбек и мгновенное применение.
 */
export function usePriceOverrides(brandId: string | null) {
  const [cloud, setCloud] = useState<Record<string, number>>({});
  const [local, setLocal] = useState<Record<string, number>>(() =>
    typeof window !== "undefined" ? localFor(brandId) : {},
  );

  useEffect(() => {
    setLocal(localFor(brandId));
    if (!brandId) {
      setCloud({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const c = await listPricesForBrand(brandId);
        if (!cancelled) setCloud(c);
      } catch {
        /* offline — используем local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const merged: Record<string, number> = { ...local, ...cloud };

  const setPrice = useCallback(
    async (serviceId: string, price: number) => {
      if (!brandId) return;
      const all = readLocal();
      all[`${brandId}:${serviceId}`] = price;
      writeLocal(all);
      setLocal((prev) => ({ ...prev, [serviceId]: price }));
      try {
        await upsertServicePrice(serviceId, brandId, price);
        setCloud((prev) => ({ ...prev, [serviceId]: price }));
      } catch {
        /* offline — локально сохранено */
      }
    },
    [brandId],
  );

  const resetPrice = useCallback(
    async (serviceId: string) => {
      if (!brandId) return;
      const all = readLocal();
      delete all[`${brandId}:${serviceId}`];
      writeLocal(all);
      setLocal((prev) => {
        const n = { ...prev };
        delete n[serviceId];
        return n;
      });
      try {
        await deleteServicePrice(serviceId, brandId);
        setCloud((prev) => {
          const n = { ...prev };
          delete n[serviceId];
          return n;
        });
      } catch {
        /* offline */
      }
    },
    [brandId],
  );

  return { prices: merged, setPrice, resetPrice };
}
