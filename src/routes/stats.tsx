import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAppointments } from "@/lib/api";
import { AdminStats } from "@/components/AdminStats";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export const Route = createFileRoute("/stats")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Статистика — Samson Auto CRM" },
      { name: "description", content: "Сводка по автосервису и дебиторка." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });

  const debtors = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.status === "done" &&
            a.payment_status !== "paid" &&
            (a.total_price ?? 0) - (a.paid_amount ?? 0) > 0,
        )
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
    [appointments],
  );

  const totalDebt = debtors.reduce(
    (s, a) => s + ((a.total_price ?? 0) - (a.paid_amount ?? 0)),
    0,
  );
  const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

  return (
    <div>
      <AdminStats />

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold sm:text-lg">Дебиторка</h3>
                <p className="text-xs text-muted-foreground">
                  Выполненные работы, за которые ещё не расплатились
                </p>
              </div>
              <Badge variant="secondary" className="text-base">
                Итого: {fmt(totalDebt)}
              </Badge>
            </div>

            {debtors.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                Долгов нет — все клиенты рассчитались.
              </div>
            ) : (
              <div className="space-y-2">
                {debtors.map((a) => {
                  const debt = (a.total_price ?? 0) - (a.paid_amount ?? 0);
                  return (
                    <Link
                      key={a.id}
                      to="/schedule"
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {a.car?.client?.full_name ?? "—"}
                          {a.car?.client?.phone ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {a.car.client.phone}
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.car?.brand?.name} {a.car?.model}
                          {a.car?.license_plate ? ` · ${a.car.license_plate}` : ""}
                          {" · "}
                          {format(parseISO(a.starts_at), "d MMM yyyy", { locale: ru })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-red-600">{fmt(debt)}</div>
                        <div className="text-xs text-muted-foreground">
                          из {fmt(a.total_price ?? 0)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
