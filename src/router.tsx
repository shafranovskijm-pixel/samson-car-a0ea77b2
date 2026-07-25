import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { makeQueryClient, attachOfflinePersistence } from "./lib/offlineCache";

export const getRouter = () => {
  const queryClient = makeQueryClient();
  attachOfflinePersistence(queryClient);
  const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ...(isFileProtocol ? { history: createHashHistory() } : {}),
  });

  return router;
};
