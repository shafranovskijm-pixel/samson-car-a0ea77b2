// Персист кэша TanStack Query в localStorage + индикатор онлайн/оффлайн.
// Даёт "оффлайн-режим для чтения": последние загруженные данные доступны
// сразу без сети. Мутации (create/update/delete) TanStack Query автоматически
// поставит на паузу при потере соединения (networkMode: 'online') и запустит
// после восстановления.
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const CACHE_KEY = "samson-crm-query-cache-v1";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,           // минуту считать свежим
        gcTime: 1000 * 60 * 60 * 24 * 7, // хранить неделю
        retry: 2,
        refetchOnWindowFocus: false,
        networkMode: "offlineFirst",
      },
      mutations: {
        networkMode: "online", // пауза при офлайне, авто-ретрай при онлайне
        retry: 3,
      },
    },
  });
}

export function attachOfflinePersistence(client: QueryClient) {
  if (typeof window === "undefined") return;
  try {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: CACHE_KEY,
      throttleTime: 1000,
    });
    persistQueryClient({
      queryClient: client as unknown as Parameters<typeof persistQueryClient>[0]["queryClient"],
      persister,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 дней
    });
  } catch (e) {
    console.warn("[offline] persist failed", e);
  }
}
