import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Calculator,
  Users,
  ListChecks,
  Car,
  Wrench,
  ArrowRight,
  Clock,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listAppointments,
  listCars,
  listClients,
  listMechanics,
} from "@/lib/api";
import { STATUS_COLORS, STATUS_LABELS, type AppointmentStatus } from "@/lib/types";

export const Route = createFileRoute("/")({
  ssr: false,
  component: DashboardPage,
});

function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);
  const to = useMemo(() => {
    const d = new Date(from);
    d.setDate(d.getDate() + 7);
    return d;
  }, [from]);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const { data: cars = [] } = useQuery({ queryKey: ["cars"], queryFn: listCars });
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });
  const { data: upcoming = [] } = useQuery({
    queryKey: ["dashboard-upcoming", from.toISOString(), to.toISOString()],
    queryFn: () => listAppointments(from, to),
  });

  const todayISO = from.toISOString().slice(0, 10);
  const todayCount = upcoming.filter((a) => a.starts_at.slice(0, 10) === todayISO).length;

  const shortcuts = [
    { to: "/calendar", label: "Календарь записей", desc: "Добавить/просмотреть записи", icon: CalendarIcon, color: "from-blue-500 to-indigo-600" },
    { to: "/calculator", label: "Калькулятор", desc: "Расчёт стоимости услуг", icon: Calculator, color: "from-orange-500 to-red-600" },
    { to: "/clients", label: "Клиенты и машины", desc: "Управление базой клиентов", icon: Users, color: "from-emerald-500 to-teal-600" },
    { to: "/schedule", label: "Записи по дням", desc: "Список работ по датам", icon: ListChecks, color: "from-violet-500 to-purple-600" },
  ] as const;

  const stats = [
    { label: "Клиентов", value: clients.length, icon: Users },
    { label: "Машин", value: cars.length, icon: Car },
    { label: "Мастеров", value: mechanics.length, icon: Wrench },
    { label: "Записей сегодня", value: todayCount, icon: CalendarIcon },
  ];

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Главная</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Обзор автосервиса Samson · {now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* STATS */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                <s.icon className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SHORTCUTS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="font-semibold">{s.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
            <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* UPCOMING APPOINTMENTS */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ближайшие записи</h2>
              <p className="text-xs text-muted-foreground">На ближайшие 7 дней</p>
            </div>
            <Link to="/calendar" className="text-sm text-primary hover:underline">
              Открыть календарь →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              Записей нет — самое время{" "}
              <Link to="/calendar" className="text-primary hover:underline">
                создать первую
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 8).map((a) => {
                const status = a.status as AppointmentStatus;
                return (
                  <Link
                    key={a.id}
                    to="/calendar"
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/40"
                  >
                    <div className="flex min-w-40 items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {fmtDate(a.starts_at)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {a.car?.brand?.name} {a.car?.model}
                        {a.car?.license_plate ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {a.car.license_plate}
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.car?.client?.full_name ?? "—"}
                        {a.mechanic ? ` · ${a.mechanic.full_name}` : ""}
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
                    <div className="text-sm font-medium">
                      {new Intl.NumberFormat("ru-RU").format(a.total_price)} ₽
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
