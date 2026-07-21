import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UsageMap = Record<string, { count: number; lastAt: string }>;

const LS_KEY = "calc:service-usage";

const readLocal = (): UsageMap => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as UsageMap) : {};
  } catch {
    return {};
  }
};

const writeLocal = (m: UsageMap) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {
    /* ignore quota */
  }
};

const mergeMax = (a: UsageMap, b: UsageMap): UsageMap => {
  const out: UsageMap = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const prev = out[k];
    if (!prev) {
      out[k] = { ...v };
    } else {
      out[k] = {
        count: Math.max(prev.count, v.count),
        lastAt: prev.lastAt > v.lastAt ? prev.lastAt : v.lastAt,
      };
    }
  }
  return out;
};

export function useServiceUsage() {
  const [usage, setUsage] = useState<UsageMap>(() =>
    typeof window !== "undefined" ? readLocal() : {},
  );

  // Синк с облаком при монтировании.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("service_usage_stats")
        .select("service_id, count, last_used_at");
      if (cancelled || error || !data) return;
      const cloud: UsageMap = {};
      (data as Array<{ service_id: string; count: number; last_used_at: string }>).forEach((r) => {
        cloud[r.service_id] = { count: r.count, lastAt: r.last_used_at };
      });
      setUsage((prev) => {
        const merged = mergeMax(prev, cloud);
        writeLocal(merged);
        return merged;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bump = useCallback((serviceIds: string[]) => {
    if (!serviceIds.length) return;
    const nowIso = new Date().toISOString();
    setUsage((prev) => {
      const next = { ...prev };
      serviceIds.forEach((id) => {
        const p = next[id];
        next[id] = { count: (p?.count ?? 0) + 1, lastAt: nowIso };
      });
      writeLocal(next);
      // Отправляем в облако в фоне.
      (async () => {
        for (const id of serviceIds) {
          if (id.startsWith("custom:")) continue;
          const c = next[id].count;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("service_usage_stats")
            .upsert(
              { service_id: id, count: c, last_used_at: nowIso },
              { onConflict: "service_id" },
            );
        }
      })().catch(() => {
        /* offline — ok, локально уже сохранили */
      });
      return next;
    });
  }, []);

  // Топ с затуханием: балл = count * exp(-days/60).
  const topServiceIds = useCallback(
    (limit = 6): string[] => {
      const now = Date.now();
      const scored = Object.entries(usage).map(([id, v]) => {
        const days = Math.max(0, (now - new Date(v.lastAt).getTime()) / 86400000);
        const score = v.count * Math.exp(-days / 60);
        return { id, score };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit).map((s) => s.id);
    },
    [usage],
  );

  return { usage, bump, topServiceIds };
}
