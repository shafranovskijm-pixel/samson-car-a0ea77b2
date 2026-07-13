import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
      { title: "CRM для автосервиса" },
      {
        name: "description",
        content: "CRM для автосервиса: запись клиентов, календарь, услуги, прайс и мастера.",
      },
      { property: "og:title", content: "CRM для автосервиса" },
      {
        property: "og:description",
        content: "Учёт клиентов, машин и услуг автосервиса с календарём записей.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
      <AuthProvider>
        <AppShell />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const { isAuthed, logout } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isLanding = pathname === "/";

  // Landing page — no sidebar
  if (isLanding) {
    return (
      <main className="min-h-screen">
        <Outlet />
      </main>
    );
  }

  // CRM routes — require auth
  if (!isAuthed) {
    return <LockedScreen />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center justify-between border-b bg-background px-3">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="ml-3 text-sm font-medium">Samson Auto — CRM</div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Выйти
            </Button>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LockedScreen() {
  const { openLogin } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 text-white">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Доступ ограничен</h1>
        <p className="mt-2 text-sm text-white/60">
          Раздел CRM доступен только сотрудникам Samson Auto.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={openLogin} className="bg-red-600 text-white hover:bg-red-700">
            Войти в CRM
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">На главную</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

