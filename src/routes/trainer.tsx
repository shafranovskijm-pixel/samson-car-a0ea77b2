import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Dumbbell, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTrainerSession, logout } from "@/lib/authGate";
import {
  addGymPayment,
  confirmGymPayout,
  listGymEntries,
  listGymPayouts,
  listTrainerEntries,
  markGymVisit,
  type GymEntry,
} from "@/lib/gymApi";

/** Сколько клиент фактически заплатил по занятию. */
function gotSum(r: { amount: number; paid: boolean; paid_amount?: number }) {
  const p = Number(r.paid_amount ?? 0);
  if (p > 0) return Math.min(p, Number(r.amount));
  return r.paid ? Number(r.amount) : 0;
}

export const Route = createFileRoute("/trainer")({
  component: TrainerPage,
  head: () => ({
    meta: [
      { title: "Samson Fit — кабинет тренера" },
      { name: "description", content: "Личный кабинет тренера: занятия, начисления и подтверждение выплат." },
      { property: "og:title", content: "Samson Fit — кабинет тренера" },
      { property: "og:description", content: "Личный кабинет тренера: занятия, начисления и подтверждение выплат." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function money(n: number) {
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

function TrainerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const session = getTrainerSession();
  const [month, setMonth] = useState(currentMonth());
  const { from, to } = monthRange(month);

  const entries = useQuery({
    queryKey: ["gym-entries", from, to],
    queryFn: () => listGymEntries(from, to),
    enabled: !!session,
  });
  const payouts = useQuery({
    queryKey: ["gym-payouts", session?.id],
    queryFn: () => listGymPayouts(session!.id),
    enabled: !!session,
  });
  // Счёт тренера: все занятия и выплаты за всё время, независимо от выбранного месяца
  const allEntries = useQuery({
    queryKey: ["gym-trainer-entries", session?.id],
    queryFn: () => listTrainerEntries(session!.id),
    enabled: !!session,
  });

  const confirm = useMutation({
    mutationFn: (id: string) => confirmGymPayout(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-payouts"] });
      toast.success("Получение подтверждено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markVisit = useMutation({
    mutationFn: async ({ entry, used }: { entry: GymEntry; used: number }) => {
      await markGymVisit(entry.id, used);
      // Проводим занятие по кассе: цена одного занятия уходит в поступления
      // и в начисление тренеру (только при отметке, не при отмене).
      const total = Math.max(1, Number(entry.sessions_total));
      const perSession = Number(entry.amount) / total;
      const rest = Number(entry.amount) - Math.min(Number(entry.paid_amount ?? 0), Number(entry.amount));
      const add = used > Number(entry.sessions_used) ? Math.min(perSession, rest) : 0;
      if (add > 0) await addGymPayment(entry, add);
      return add;
    },
    onSuccess: (add) => {
      qc.invalidateQueries({ queryKey: ["gym-entries"] });
      qc.invalidateQueries({ queryKey: ["gym-trainer-entries"] });
      toast.success(
        add > 0
          ? `Занятие проведено, в кассу ${money(add)}`
          : "Отметка обновлена",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(
    () => (entries.data ?? []).filter((r) => r.trainer_id === session?.id),
    [entries.data, session?.id],
  );

  const totals = useMemo(() => {
    const paidRows = rows.filter((r) => gotSum(r) > 0);
    const sum = paidRows.reduce((a, r) => a + gotSum(r), 0);
    const accrued = paidRows.reduce(
      (a, r) => a + (gotSum(r) * Number(r.trainer_percent)) / 100,
      0,
    );
    const paidOut = (payouts.data ?? [])
      .filter((p) => p.status === "confirmed" && p.paid_at >= from && p.paid_at <= to)
      .reduce((a, p) => a + Number(p.amount), 0);
    return { count: paidRows.length, sum, accrued, paidOut, rest: accrued - paidOut };
  }, [rows, payouts.data, from, to]);

  // Счёт за всё время
  const ledger = useMemo(() => {
    const accruedAll = (allEntries.data ?? [])
      .reduce((a, r) => a + (gotSum(r) * Number(r.trainer_percent)) / 100, 0);
    const allPayouts = payouts.data ?? [];
    const receivedAll = allPayouts
      .filter((p) => p.status === "confirmed")
      .reduce((a, p) => a + Number(p.amount), 0);
    const pending = allPayouts
      .filter((p) => p.status !== "confirmed")
      .reduce((a, p) => a + Number(p.amount), 0);
    return { accruedAll, receivedAll, owed: Math.max(0, accruedAll - receivedAll), pending };
  }, [allEntries.data, payouts.data]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Сессия не найдена. Войдите заново.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-12 items-center gap-2 border-b px-3">
        <Dumbbell className="h-4 w-4" />
        <div className="truncate text-sm font-medium">{session.name}</div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          title="Выйти"
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="space-y-4 p-3 sm:p-4">
        {/* Счёт тренера за всё время */}
        <Card className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Счёт тренера — за всё время</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Причитается всего</span>
              <span className="font-semibold">{money(ledger.accruedAll)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Получено всего</span>
              <span className="font-semibold">{money(ledger.receivedAll)}</span>
            </div>
            {ledger.pending > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Из них ждёт подтверждения</span>
                <span className="font-semibold text-amber-600">{money(ledger.pending)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-medium">К выдаче</span>
              <span className={`text-xl font-bold ${ledger.owed > 0 ? "text-emerald-600" : ""}`}>
                {money(ledger.owed)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div>
          <Label htmlFor="month">Месяц</Label>
          <Input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-[170px]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Начислено ({totals.count} зан.)</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{money(totals.accrued)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Выплачено</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{money(totals.paidOut)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Остаток</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-600">{money(totals.rest)}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payouts">
          <TabsList className="w-full">
            <TabsTrigger value="payouts" className="flex-1">Выплаты</TabsTrigger>
            <TabsTrigger value="entries" className="flex-1">Мои занятия</TabsTrigger>
          </TabsList>

          <TabsContent value="payouts" className="space-y-2">
            {(payouts.data ?? []).length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">Выплат пока нет</p>
            )}
            {(payouts.data ?? []).map((p) => (
              <Card key={p.id} className={p.status === "confirmed" ? "" : "border-amber-500"}>
                <CardContent className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">{money(Number(p.amount))}</div>
                    <div className="text-xs text-muted-foreground">
                      Отправлено: {p.paid_at.split("-").reverse().join(".")}
                      {p.note ? ` — ${p.note}` : ""}
                    </div>
                    {p.status === "confirmed" && p.confirmed_at && (
                      <div className="text-xs text-emerald-600">
                        Получено: {new Date(p.confirmed_at).toLocaleDateString("ru-RU")}
                      </div>
                    )}
                  </div>
                  <div className="ml-auto">
                    {p.status === "confirmed" ? (
                      <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Получено
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => confirm.mutate(p.id)} disabled={confirm.isPending}>
                        <Clock className="mr-1 h-4 w-4" /> Подтвердить получение
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="entries" className="space-y-2">
            {rows.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">Нет занятий за месяц</p>
            )}
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <span className="font-medium">{r.entry_date.slice(8, 10)}.{r.entry_date.slice(5, 7)}</span>
                  <span className="truncate">{r.client_name}</span>
                  <span className="text-muted-foreground">{r.package} зан.</span>
                  <span className="ml-auto font-semibold">
                    {money((gotSum(r) * Number(r.trainer_percent)) / 100)}
                  </span>
                  {gotSum(r) < Number(r.amount) && (
                    <span className="text-xs text-amber-600">
                      {gotSum(r) > 0 ? `оплачено частично ${Math.round(gotSum(r))} ₽` : "не оплачено"}
                    </span>
                  )}
                  <div className="flex w-full items-center gap-2 border-t pt-2">
                    <span className="text-xs text-muted-foreground">
                      Осталось занятий: {Math.max(0, Number(r.sessions_total) - Number(r.sessions_used))} из {r.sessions_total}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {Number(r.sessions_used) > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={markVisit.isPending || r.frozen}
                          onClick={() => markVisit.mutate({ id: r.id, used: Number(r.sessions_used) - 1 })}
                        >
                          Отменить
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={
                          markVisit.isPending ||
                          r.frozen ||
                          Number(r.sessions_used) >= Number(r.sessions_total)
                        }
                        onClick={() => markVisit.mutate({ id: r.id, used: Number(r.sessions_used) + 1 })}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        {Number(r.sessions_used) >= Number(r.sessions_total)
                          ? "Абонемент закрыт"
                          : r.frozen
                            ? "Заморожен"
                            : "Тренировка проведена"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
