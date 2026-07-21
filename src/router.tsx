import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { makeQueryClient, attachOfflinePersistence } from "./lib/offlineCache";

export const getRouter = () => {
  const queryClient = makeQueryClient();
  attachOfflinePersistence(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
