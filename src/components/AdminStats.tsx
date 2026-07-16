import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  Users,
  Car,
  Wrench,
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
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/types";

export function AdminStats() {
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
    <section className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold sm:text-2xl">Статистика</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Кого сколько и когда — сводка по автосервису
          </p>
        </div>

        <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-11 sm:w-11">
                  <s.icon className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold sm:text-2xl">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                    {s.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold sm:text-lg">Ближайшие записи</h3>
                <p className="text-xs text-muted-foreground">На ближайшие 7 дней</p>
              </div>
              <Link to="/calendar" className="text-sm text-primary hover:underline">
                Открыть календарь →
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
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
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border p-3 transition hover:bg-muted/40 sm:flex sm:flex-wrap sm:gap-3"
                    >
                      <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground sm:col-auto sm:min-w-40 sm:text-sm sm:text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {fmtDate(a.starts_at)}
                      </div>
                      <div className="min-w-0 sm:flex-1">
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
    </section>
  );
}
