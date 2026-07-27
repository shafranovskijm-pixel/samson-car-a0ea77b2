import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isSameDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { toast } from "sonner";

import {
  listAppointments,
  listExpenses,
  createExpense,
  deleteExpense,
  listMechanics,
  listMechanicAdvances,
  createMechanicAdvance,
  deleteMechanicAdvance,
  listPaymentsRange,
  listServices,
  type Expense,
  type MechanicAdvance,
} from "@/lib/api";
import { effectivePayout, type PayoutMechanic, type PayoutService } from "@/lib/payouts";
import { ExpensesMonthlyTable } from "@/components/ExpensesMonthlyTable";


export const Route = createFileRoute("/expenses")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Расходы — Samson Auto CRM" },
      { name: "description", content: "Оборот, прибыль, ЗП мастеров и авансы." },
    ],
  }),
  component: ExpensesPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";

const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

function ExpensesPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd = useMemo(() => endOfMonth(month), [month]);
  const fromIso = isoDate(monthStart);
  const toIso = isoDate(monthEnd);

  const { data: appts = [] } = useQuery({
    queryKey: ["appointments", "expenses-month", fromIso, toIso],
    queryFn: () => listAppointments(monthStart, monthEnd),
  });
type Period = "day" | "week" | "month";

function ExpensesPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (period === "day") {
      return { rangeStart: startOfDay(anchor), rangeEnd: endOfDay(anchor) };
    }
    if (period === "week") {
      return {
        rangeStart: startOfWeek(anchor, { weekStartsOn: 1 }),
        rangeEnd: endOfWeek(anchor, { weekStartsOn: 1 }),
      };
    }
    return { rangeStart: startOfMonth(anchor), rangeEnd: endOfMonth(anchor) };
  }, [anchor, period]);

  const fromIso = isoDate(rangeStart);
  const toIso = isoDate(rangeEnd);

  const periodLabel =
    period === "day" ? "день" : period === "week" ? "неделю" : "месяц";

  const { data: appts = [] } = useQuery({
    queryKey: ["appointments", "expenses-range", fromIso, toIso],
    queryFn: () => listAppointments(rangeStart, rangeEnd),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", fromIso, toIso],
    queryFn: () => listExpenses(fromIso, toIso),
  });
  const { data: mechanics = [] } = useQuery({
    queryKey: ["mechanics"],
    queryFn: () => listMechanics(),
  });
  const { data: advances = [] } = useQuery({
    queryKey: ["mechanic_advances", fromIso, toIso],
    queryFn: () => listMechanicAdvances({ from: fromIso, to: toIso }),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["payments-range", fromIso, toIso],
    queryFn: () => listPaymentsRange(fromIso, toIso),
  });

  // Только выполненные записи участвуют в «начислении» ЗП и обязательств.
  const doneAppts = useMemo(() => appts.filter((a) => a.status === "done"), [appts]);
  // Запланированные/в работе — потенциальные поступления (если не отменятся).
  const upcomingAppts = useMemo(
    () => appts.filter((a) => a.status !== "done" && a.status !== "cancelled"),
    [appts],
  );

  const { data: servicesList = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => listServices(),
  });

  // Единый расчёт выплаты за строку услуги (индивидуальный % мастера → % услуги → 50%).
  const mechById = useMemo(() => {
    const m = new Map<string, PayoutMechanic>();
    mechanics.forEach((x) =>
      m.set(x.id, {
        default_payout_percent:
          (x as { default_payout_percent?: number | null }).default_payout_percent ?? null,
      }),
    );
    return m;
  }, [mechanics]);
  const svcById = useMemo(() => {
    const m = new Map<string, PayoutService>();
    servicesList.forEach((s) =>
      m.set(s.id, {
        default_payout_percent:
          (s as { default_payout_percent?: number | null }).default_payout_percent ?? null,
      }),
    );
    return m;
  }, [servicesList]);
  const effPayout = (
    mechanicId: string | null,
    price: number,
    stored: number,
    serviceId?: string | null,
  ) =>
    effectivePayout({
      storedPayout: stored,
      price,
      mechanic: mechanicId ? mechById.get(mechanicId) ?? null : null,
      service: serviceId ? svcById.get(serviceId) ?? null : null,
    });
  const apptPayout = (a: ApptRow) =>
    (a.services ?? []).reduce(
      (s, x) =>
        s +
        effPayout(
          a.mechanic_id,
          Number(x.price ?? 0),
          Number(x.mechanic_payout ?? 0),
          x.service_id,
        ),
      0,
    );

  // Оборот кассы за период = все фактические платежи клиентов с paid_at в этом диапазоне
  // (независимо от того, в каком периоде сама запись).
  const revenue = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  // Дебиторка по выполненным работам этого периода: сколько ещё не оплачено.
  const unpaidBalance = doneAppts.reduce(
    (s, a) => s + Math.max(0, (a.total_price ?? 0) - Number(a.paid_amount ?? 0)),
    0,
  );
  // Ожидается поступлений: неоплаченная часть по запланированным/в работе записям.
  const expectedIncome = upcomingAppts.reduce(
    (s, a) => s + Math.max(0, (a.total_price ?? 0) - Number(a.paid_amount ?? 0)),
    0,
  );
  const expectedCount = upcomingAppts.length;

  // Начислено мастерам (по всем выполненным работам периода) — с учётом % мастера/услуги.
  const mechanicsAccrued = doneAppts.reduce((s, a) => s + apptPayout(a), 0);
  // Фактически выплачено мастерам за период (авансы)
  const mechanicsPaid = advances.reduce((s, a) => s + Number(a.amount ?? 0), 0);
  // Оборот по выполненным работам (начисление, независимо от даты оплаты)
  const accruedRevenue = doneAppts.reduce((s, a) => s + Number(a.total_price ?? 0), 0);


  const otherExpenses = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const cashProfit = revenue - mechanicsAccrued - otherExpenses;
  const accruedProfit = accruedRevenue - mechanicsAccrued - otherExpenses;
  const mechanicsDebt = mechanicsAccrued - mechanicsPaid;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">Расходы</h1>
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
            Оборот, прибыль, ЗП мастеров и авансы за {periodLabel}
          </p>
        </div>
        <div className="shrink-0">
          <RangePicker
            period={period}
            setPeriod={setPeriod}
            anchor={anchor}
            setAnchor={setAnchor}
          />
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Прибыль (кассовая) — герой */}
        <Card
          className={`border-2 ${cashProfit >= 0 ? "border-green-500/30" : "border-red-500/30"} sm:col-span-2 lg:col-span-1`}
        >
          <CardContent className="flex h-full flex-col p-4 sm:p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Чистая прибыль
            </div>
            <div
              className={`mt-1.5 text-xl font-bold tracking-tight tabular-nums sm:text-2xl ${
                cashProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {fmt(cashProfit)}
            </div>
          </CardContent>
        </Card>


        {/* Доходы */}
        <Card>
          <CardContent className="flex h-full flex-col p-4 sm:p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Доходы
            </div>
            <div className="mt-1.5 truncate text-2xl font-bold">{fmt(revenue)}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Оборот кассы (платежи за {periodLabel})
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3 border-t pt-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ожидается
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold">
                  {fmt(expectedIncome)}
                </div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {expectedCount} запис
                  {expectedCount === 1
                    ? "ь"
                    : expectedCount > 1 && expectedCount < 5
                      ? "и"
                      : "ей"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ждём оплату
                </div>
                <div
                  className={`mt-0.5 truncate text-sm font-semibold ${unpaidBalance > 0 ? "text-amber-600" : ""}`}
                >
                  {fmt(unpaidBalance)}
                </div>
                <div className="truncate text-[10px] text-muted-foreground">
                  по работам месяца
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ЗП мастерам */}
        <Card>
          <CardContent className="flex h-full flex-col p-4 sm:p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Зарплаты (мастера)
            </div>
            <div className="mt-1.5 truncate text-2xl font-bold text-amber-600">
              {fmt(mechanicsAccrued)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Начислено в этом периоде
            </div>
            <div className="mt-auto border-t pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {mechanicsDebt >= 0 ? "К выплате" : "Переплата"}
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    mechanicsDebt > 0
                      ? "text-amber-600"
                      : mechanicsDebt < 0
                        ? "text-red-600"
                        : "text-green-600"
                  }`}
                >
                  {fmt(Math.abs(mechanicsDebt))}
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{
                    width: `${
                      mechanicsAccrued > 0
                        ? Math.min(100, Math.round((mechanicsPaid / mechanicsAccrued) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="mt-1 truncate text-[10px] text-muted-foreground">
                выплачено {fmt(mechanicsPaid)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Прочие расходы */}
        <Card>
          <CardContent className="flex h-full flex-col p-4 sm:p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Прочие расходы
            </div>
            <div className="mt-1.5 truncate text-2xl font-bold text-amber-600">
              {fmt(otherExpenses)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Аренда, налоги, расходники
            </div>
            <div className="mt-auto pt-3">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("expenses-block")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-amber-600"
              >
                Подробнее
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>






      <Tabs defaultValue="summary">
        <TabsList className="no-print">
          <TabsTrigger value="summary">Сводка</TabsTrigger>
          <TabsTrigger value="mechanics">По мастерам</TabsTrigger>
          <TabsTrigger value="services">По услугам</TabsTrigger>
          <TabsTrigger value="table">Сводная таблица</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <ExpensesBlock
            expenses={expenses}
            fromIso={fromIso}
            toIso={toIso}
            defaultDate={fromIso}
          />
        </TabsContent>

        <TabsContent value="mechanics" className="mt-4">
          <MechanicsBlock
            mechanics={mechanics}
            appts={doneAppts}
            advances={advances}
            fromIso={fromIso}
            toIso={toIso}
            apptPayout={apptPayout}
            effPayout={effPayout}
          />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServicesBlock appts={doneAppts} effPayout={effPayout} />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <ExpensesMonthlyTable
            month={month}
            appts={doneAppts}
            mechanics={mechanics}
            advances={advances}
            mechById={mechById}
            svcById={svcById}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
}

function MonthPicker({
  month,
  setMonth,
}: {
  month: Date;
  setMonth: (d: Date) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1">
      <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[140px] text-center text-sm font-medium capitalize">
        {format(month, "LLLL yyyy", { locale: ru })}
      </div>
      <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="ml-1"
        onClick={() => setMonth(startOfMonth(new Date()))}
      >
        Сегодня
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "warn" | "neutral";
  hint?: string;
}) {
  const toneClass = {
    good: "text-green-600",
    bad: "text-red-600",
    warn: "text-amber-600",
    neutral: "text-foreground",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-xl font-bold sm:text-2xl ${toneClass}`}>{value}</div>
        {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

// -------- Expenses block --------
function ExpensesBlock({
  expenses,
  fromIso,
  toIso,
  defaultDate,
}: {
  expenses: Expense[];
  fromIso: string;
  toIso: string;
  defaultDate: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    spent_at: defaultDate,
    title: "",
    amount: "",
    note: "",
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["expenses", fromIso, toIso] });

  const create = useMutation({
    mutationFn: () =>
      createExpense({
        spent_at: form.spent_at,
        title: form.title.trim(),
        amount: Number(form.amount) || 0,
        note: form.note.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm({ spent_at: defaultDate, title: "", amount: "", note: "" });
      toast.success("Расход добавлен");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast.success("Удалено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card id="expenses-block">

      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold sm:text-lg">Прочие расходы</h3>
            <p className="text-xs text-muted-foreground">
              Всё, что не относится к ЗП мастеров
            </p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Добавить
          </Button>
        </div>

        {expenses.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            За этот месяц ещё нет записей о расходах.
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{e.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {format(parseISO(e.spent_at), "d MMM yyyy", { locale: ru })}
                    {e.note ? ` · ${e.note}` : ""}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold">{fmt(Number(e.amount))}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete(e)}
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый расход</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Название</Label>
              <Input
                value={form.title}
                onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
                placeholder="Аренда, коммуналка, запчасти…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Дата</Label>
                <Input
                  type="date"
                  value={form.spent_at}
                  onChange={(ev) => setForm((f) => ({ ...f, spent_at: ev.target.value }))}
                />
              </div>
              <div>
                <Label>Сумма, ₽</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={(ev) => setForm((f) => ({ ...f, amount: ev.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Заметка</Label>
              <Textarea
                value={form.note}
                onChange={(ev) => setForm((f) => ({ ...f, note: ev.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!form.title.trim() || !form.amount || create.isPending}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить расход?</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete?.title}» на {fmt(Number(pendingDelete?.amount ?? 0))}. Это действие
              нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// -------- Mechanics block --------
type ApptRow = Awaited<ReturnType<typeof listAppointments>>[number];

function MechanicsBlock({
  mechanics,
  appts,
  advances,
  fromIso,
  toIso,
  apptPayout,
}: {
  mechanics: { id: string; full_name: string }[];
  appts: ApptRow[];
  advances: MechanicAdvance[];
  fromIso: string;
  toIso: string;
  apptPayout: (a: ApptRow) => number;
  effPayout: (mechanicId: string | null, price: number, stored: number) => number;
}) {

  const byMech = useMemo(() => {
    const map = new Map<string, { payout: number; rows: ApptRow[] }>();
    appts.forEach((a) => {
      if (!a.mechanic_id) return;
      const entry = map.get(a.mechanic_id) ?? { payout: 0, rows: [] };
      entry.payout += apptPayout(a);
      entry.rows.push(a);
      map.set(a.mechanic_id, entry);
    });
    return map;
  }, [appts, apptPayout]);


  const advByMech = useMemo(() => {
    const map = new Map<string, { total: number; rows: MechanicAdvance[] }>();
    advances.forEach((adv) => {
      const entry = map.get(adv.mechanic_id) ?? { total: 0, rows: [] };
      entry.total += Number(adv.amount ?? 0);
      entry.rows.push(adv);
      map.set(adv.mechanic_id, entry);
    });
    return map;
  }, [advances]);

  const displayed = mechanics.filter(
    (m) => (byMech.get(m.id)?.payout ?? 0) > 0 || (advByMech.get(m.id)?.total ?? 0) > 0,
  );
  const list = displayed.length > 0 ? displayed : mechanics;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold sm:text-lg">ЗП мастеров за месяц</h3>
          <p className="text-xs text-muted-foreground">
            Начислено = сумма ставок мастера по выполненным работам. К выплате = начислено − авансы.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            Нет мастеров.
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {list.map((m) => {
              const payout = byMech.get(m.id)?.payout ?? 0;
              const rows = byMech.get(m.id)?.rows ?? [];
              const advTotal = advByMech.get(m.id)?.total ?? 0;
              const advRows = advByMech.get(m.id)?.rows ?? [];
              const toPay = payout - advTotal;
              return (
                <AccordionItem
                  key={m.id}
                  value={m.id}
                  className="rounded-lg border px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 pr-2 text-left">
                      <div className="truncate text-sm font-medium">{m.full_name}</div>
                      <Badge variant="secondary">Начислено {fmt(payout)}</Badge>
                      <Badge variant="outline">Аванс {fmt(advTotal)}</Badge>
                      <Badge
                        className={
                          toPay >= 0
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        }
                      >
                        К выплате {fmt(toPay)}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <MechanicDetails
                      mechanicId={m.id}
                      rows={rows}
                      advances={advRows}
                      fromIso={fromIso}
                      toIso={toIso}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

function MechanicDetails({
  mechanicId,
  rows,
  advances,
  fromIso,
  toIso,
}: {
  mechanicId: string;
  rows: ApptRow[];
  advances: MechanicAdvance[];
  fromIso: string;
  toIso: string;
}) {
  const qc = useQueryClient();
  const [advOpen, setAdvOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MechanicAdvance | null>(null);
  const [form, setForm] = useState({ paid_at: fromIso, amount: "", note: "" });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["mechanic_advances", fromIso, toIso] });

  const create = useMutation({
    mutationFn: () =>
      createMechanicAdvance({
        mechanic_id: mechanicId,
        paid_at: form.paid_at,
        amount: Number(form.amount) || 0,
        note: form.note.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      setAdvOpen(false);
      setForm({ paid_at: fromIso, amount: "", note: "" });
      toast.success("Аванс добавлен");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMechanicAdvance(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast.success("Удалено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Flatten services per appointment
  const serviceRows = rows
    .flatMap((a) =>
      (a.services ?? []).map((s) => ({
        appt_id: a.id,
        starts_at: a.starts_at,
        client: a.car?.client?.full_name ?? "—",
        car: `${a.car?.brand?.name ?? ""} ${a.car?.model ?? ""}`.trim(),
        service_name: s.service?.name ?? "—",
        price: Number(s.price ?? 0),
        payout: Number(s.mechanic_payout ?? 0),
      })),
    )
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-2 text-sm font-semibold">Работы за месяц</div>
        {serviceRows.length === 0 ? (
          <div className="rounded border border-dashed py-6 text-center text-xs text-muted-foreground">
            Нет выполненных работ.
          </div>
        ) : (
          <div className="space-y-1">
            {serviceRows.map((r, i) => (
              <div
                key={`${r.appt_id}-${i}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.service_name}</div>
                  <div className="truncate text-muted-foreground">
                    {format(parseISO(r.starts_at), "d MMM", { locale: ru })} · {r.client}
                    {r.car ? ` · ${r.car}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-700">{fmt(r.payout)}</div>
                  <div className="text-muted-foreground">из {fmt(r.price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Авансы</div>
          <Button size="sm" variant="outline" onClick={() => setAdvOpen(true)}>
            <Plus className="mr-1 h-3 w-3" /> Аванс
          </Button>
        </div>
        {advances.length === 0 ? (
          <div className="rounded border border-dashed py-6 text-center text-xs text-muted-foreground">
            Авансов ещё не было.
          </div>
        ) : (
          <div className="space-y-1">
            {advances.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded border p-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {format(parseISO(a.paid_at), "d MMM yyyy", { locale: ru })}
                  </div>
                  {a.note ? (
                    <div className="truncate text-muted-foreground">{a.note}</div>
                  ) : null}
                </div>
                <div className="text-right font-semibold">{fmt(Number(a.amount))}</div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPendingDelete(a)}
                  aria-label="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={advOpen} onOpenChange={setAdvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый аванс</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Дата</Label>
                <Input
                  type="date"
                  value={form.paid_at}
                  onChange={(ev) => setForm((f) => ({ ...f, paid_at: ev.target.value }))}
                />
              </div>
              <div>
                <Label>Сумма, ₽</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={(ev) => setForm((f) => ({ ...f, amount: ev.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Заметка</Label>
              <Input
                value={form.note}
                onChange={(ev) => setForm((f) => ({ ...f, note: ev.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => create.mutate()} disabled={!form.amount || create.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аванс?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${format(parseISO(pendingDelete.paid_at), "d MMM yyyy", { locale: ru })} — ${fmt(Number(pendingDelete.amount))}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// -------- Services block --------
function ServicesBlock({
  appts,
  effPayout,
}: {
  appts: ApptRow[];
  effPayout: (mechanicId: string | null, price: number, stored: number) => number;
}) {
  const rows = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; revenue: number; payout: number }
    >();
    appts.forEach((a) => {
      (a.services ?? []).forEach((s) => {
        const key = s.service_id;
        const cur = map.get(key) ?? {
          name: s.service?.name ?? "—",
          count: 0,
          revenue: 0,
          payout: 0,
        };
        cur.count += 1;
        cur.revenue += Number(s.price ?? 0);
        cur.payout += effPayout(a.mechanic_id, Number(s.price ?? 0), Number(s.mechanic_payout ?? 0));
        map.set(key, cur);
      });
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [appts, effPayout]);


  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold sm:text-lg">По услугам</h3>
          <p className="text-xs text-muted-foreground">
            Топ услуг за месяц: количество, выручка, ЗП мастерам, маржа
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            Нет выполненных работ за месяц.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_60px_110px_110px_110px] gap-2 border-b pb-1 text-xs font-semibold text-muted-foreground">
              <div>Услуга</div>
              <div className="text-right">Кол-во</div>
              <div className="text-right">Выручка</div>
              <div className="text-right">ЗП мастеру</div>
              <div className="text-right">Маржа</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.name}
                className="grid grid-cols-[minmax(0,1fr)_60px_110px_110px_110px] items-center gap-2 rounded border p-2 text-sm"
              >
                <div className="truncate">{r.name}</div>
                <div className="text-right">{r.count}</div>
                <div className="text-right font-medium">{fmt(r.revenue)}</div>
                <div className="text-right text-amber-700">{fmt(r.payout)}</div>
                <div className="text-right font-semibold text-emerald-700">
                  {fmt(r.revenue - r.payout)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
