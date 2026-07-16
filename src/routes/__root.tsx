import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { UssuriyskClock } from "@/components/UssuriyskClock";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Ошибка загрузки страницы</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Повторить
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Samson Auto — CRM" },
      {
        name: "description",
        content: "Внутренняя CRM автосервиса Samson: календарь, клиенты, машины, услуги.",
      },
      { property: "og:title", content: "Samson Auto — CRM" },
      { name: "twitter:title", content: "Samson Auto — CRM" },
      { property: "og:description", content: "Внутренняя CRM автосервиса Samson: календарь, клиенты, машины, услуги." },
      { name: "twitter:description", content: "Внутренняя CRM автосервиса Samson: календарь, клиенты, машины, услуги." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6c58db5-2e88-4ad7-9ef6-00e454d34867/id-preview-b2094c8d--ddf217c8-3d5f-4fe6-9180-c8a9b5a16136.lovable.app-1784187173735.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6c58db5-2e88-4ad7-9ef6-00e454d34867/id-preview-b2094c8d--ddf217c8-3d5f-4fe6-9180-c8a9b5a16136.lovable.app-1784187173735.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-12 items-center gap-2 border-b bg-background px-2 sm:gap-3 sm:px-3">
              <SidebarTrigger />
              <div className="truncate text-sm font-medium">
                <span className="sm:hidden">Samson Auto</span>
                <span className="hidden sm:inline">Samson Auto — CRM</span>
              </div>
              <div className="ml-auto">
                <UssuriyskClock />
              </div>
            </header>

            <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
              <Outlet />
            </main>
          </div>

        </div>
      </SidebarProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
