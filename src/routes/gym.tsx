import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  Dumbbell,
  LogOut,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSection, logout } from "@/lib/authGate";
import {
  confirmGymPayout,
  createGymClient,
  createGymEntry,
  createGymExpense,
  createGymPayout,
  createGymTrainer,
  deleteGymClient,
  deleteGymEntry,
  deleteGymExpense,
  deleteGymPayout,
  deleteGymTrainer,
  listAllGymEntries,
  listGymClients,
  listGymEntries,
  listGymExpenses,
  listGymPayouts,
  listGymTrainers,
  listTrainerEntries,
  markGymVisit,
  updateGymEntry,
  updateGymTrainer,
  type GymEntry,
  type GymTrainer,
} from "@/lib/gymApi";

export const Route = createFileRoute("/gym")({
  component: GymPage,
  head: () => ({
    meta: [
      { title: "Samson Fit — тренажёрный зал" },
      { name: "description", content: "Учёт занятий, абонементов, клиентов, расходов и зарплаты тренеров." },
      { property: "og:title", content: "Samson Fit — тренажёрный зал" },
      { property: "og:description", content: "Учёт занятий, абонементов, клиентов, расходов и зарплаты тренеров." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PACKAGES = [
  { value: "1", label: "1 занятие" },
  { value: "8", label: "8 занятий" },
  { value: "12", label: "12 занятий" },
];

const PRICE_KEY = "gym-package-prices";

function money(n: number) {
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dmy(d: string) {
  return `${d.slice(8, 10)}.${d.slice(5, 7)}`;
}

function dmyFull(d: string) {
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
}

type PeriodKind = "day" | "week" | "month" | "all";

function periodRange(kind: PeriodKind, anchor: string) {
  if (kind === "all") return { from: "1900-01-01", to: "2999-12-31" };
  if (kind === "day") return { from: anchor, to: anchor };
  const d = new Date(`${anchor}T00:00:00Z`);
  if (kind === "week") {
    const dow = (d.getUTCDay() + 6) % 7;
    const start = new Date(d);
    start.setUTCDate(d.getUTCDate() - dow);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
  }
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const mm = String(m + 1).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

function periodLabel(kind: PeriodKind, from: string, to: string) {
  if (kind === "all") return "Всё время";
  if (kind === "day") return dmyFull(from);
  return `${dmyFull(from)} — ${dmyFull(to)}`;
}

function share(r: GymEntry) {
  return (Number(r.amount) * Number(r.trainer_percent)) / 100;
}

/** Сколько клиент уже заплатил (с учётом оплаты частями). */
function paidSum(r: GymEntry) {
  const p = Number(r.paid_amount ?? 0);
  if (p > 0) return Math.min(p, Number(r.amount));
  return r.paid ? Number(r.amount) : 0;
}

/** Остаток долга клиента. */
function restSum(r: GymEntry) {
  return Math.max(0, Number(r.amount) - paidSum(r));
}

/** Доля тренера от фактически полученных денег. */
function sharePaid(r: GymEntry) {
  return (paidSum(r) * Number(r.trainer_percent)) / 100;
}

function monthLabel(m: string) {
  const names = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
  return `${names[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
}

function loadPrices(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PRICE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function savePrice(pkg: string, value: number) {
  const all = loadPrices();
  all[pkg] = value;
  localStorage.setItem(PRICE_KEY, JSON.stringify(all));
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function GymPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [kind, setKind] = useState<PeriodKind>("month");
  const [anchor, setAnchor] = useState(today);
  const { from, to } = periodRange(kind, anchor);

  const trainers = useQuery({ queryKey: ["gym-trainers"], queryFn: listGymTrainers });
  const clients = useQuery({ queryKey: ["gym-clients"], queryFn: listGymClients });
  const entries = useQuery({ queryKey: ["gym-entries", from, to], queryFn: () => listGymEntries(from, to) });
  const allEntries = useQuery({ queryKey: ["gym-entries-all"], queryFn: listAllGymEntries });
  const payouts = useQuery({ queryKey: ["gym-payouts"], queryFn: () => listGymPayouts() });
  const expenses = useQuery({ queryKey: ["gym-expenses", from, to], queryFn: () => listGymExpenses(from, to) });
  const allExpenses = useQuery({ queryKey: ["gym-expenses-all"], queryFn: () => listGymExpenses() });

  const [date, setDate] = useState(today);
  const [clientName, setClientName] = useState("");
  const [trainerId, setTrainerId] = useState<string>("");
  const [pkg, setPkg] = useState("1");
  const [amount, setAmount] = useState("");
  const [paidNow, setPaidNow] = useState(true);
  const [validUntil, setValidUntil] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [editing, setEditing] = useState<GymEntry | null>(null);

  useEffect(() => {
    const price = loadPrices()[pkg];
    if (price) setAmount(String(price));
  }, [pkg]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["gym-entries"] });
    qc.invalidateQueries({ queryKey: ["gym-entries-all"] });
    qc.invalidateQueries({ queryKey: ["gym-clients"] });
    qc.invalidateQueries({ queryKey: ["gym-trainer-entries"] });
  };

  const addEntry = useMutation({
    mutationFn: async () => {
      const name = clientName.trim();
      if (!name) throw new Error("Укажите клиента");
      if (!trainerId) throw new Error("Выберите тренера");
      const sum = Number(amount.replace(",", "."));
      if (!Number.isFinite(sum) || sum <= 0) throw new Error("Укажите сумму");
      const trainer = trainers.data?.find((t) => t.id === trainerId);
      let client = clients.data?.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!client) client = await createGymClient(name);
      await createGymEntry({
        entry_date: date,
        trainer_id: trainerId,
        client_id: client.id,
        client_name: name,
        package: pkg,
        amount: sum,
        trainer_percent: trainer?.percent ?? 80,
        paid: paidNow,
        note: null,
        sessions_total: Number(pkg) || 1,
        sessions_used: 0,
        paid_amount: paidNow ? sum : 0,
        valid_until: validUntil || null,
        frozen: false,
      });
      savePrice(pkg, sum);
    },
    onSuccess: () => {
      setClientName("");
      invalidate();
      toast.success("Запись добавлена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeEntry = useMutation({ mutationFn: (id: string) => deleteGymEntry(id), onSuccess: invalidate });
  const togglePaid = useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) => updateGymEntry(id, { paid }),
    onSuccess: invalidate,
  });
  const visit = useMutation({
    mutationFn: ({ id, used }: { id: string; used: number }) => markGymVisit(id, used),
    onSuccess: invalidate,
  });

  const rows = entries.data ?? [];
  const expRows = expenses.data ?? [];
  const trainerName = (id: string | null) => trainers.data?.find((t) => t.id === id)?.name ?? "—";

  const totals = useMemo(() => {
    const income = rows.reduce((a, r) => a + paidSum(r), 0);
    const payout = rows.reduce((a, r) => a + sharePaid(r), 0);
    const debt = rows.reduce((a, r) => a + restSum(r), 0);
    const spent = expRows.reduce((a, e) => a + Number(e.amount), 0);
    return { income, payout, debt, spent, profit: income - payout - spent };
  }, [rows, expRows]);

  /** Касса зала за всё время: поступило деньгами − выдано тренерам − расходы. */
  const cash = useMemo(() => {
    const got = (allEntries.data ?? []).reduce((a, r) => a + paidSum(r), 0);
    const toTrainers = (payouts.data ?? []).reduce((a, p) => a + Number(p.amount), 0);
    const spent = (allExpenses.data ?? []).reduce((a, e) => a + Number(e.amount), 0);
    return { got, toTrainers, spent, left: got - toTrainers - spent };
  }, [allEntries.data, payouts.data, allExpenses.data]);

  const perTrainer = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sum: number; payout: number; count: number }>();
    for (const r of rows) {
      if (paidSum(r) <= 0) continue;
      const key = r.trainer_id ?? "none";
      const cur = map.get(key) ?? { id: key, name: trainerName(r.trainer_id), sum: 0, payout: 0, count: 0 };
      cur.sum += paidSum(r);
      cur.payout += sharePaid(r);
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.sum - a.sum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, trainers.data]);

  const unpaid = rows.filter((r) => restSum(r) > 0);
  const subscriptions = (allEntries.data ?? []).filter((r) => Number(r.sessions_total) > 1);

  /** Сводка по месяцам за всё время. */
  const monthly = useMemo(() => {
    const map = new Map<string, { m: string; income: number; payout: number; spent: number }>();
    const get = (m: string) => {
      const cur = map.get(m) ?? { m, income: 0, payout: 0, spent: 0 };
      map.set(m, cur);
      return cur;
    };
    for (const r of allEntries.data ?? []) {
      const cur = get(r.entry_date.slice(0, 7));
      cur.income += paidSum(r);
      cur.payout += sharePaid(r);
    }
    for (const e of allExpenses.data ?? []) get(e.expense_date.slice(0, 7)).spent += Number(e.amount);
    return [...map.values()].sort((a, b) => b.m.localeCompare(a.m));
  }, [allEntries.data, allExpenses.data]);

  function exportEntries() {
    downloadCsv(`zal-${from}_${to}.csv`, [
      ["Дата", "Клиент", "Тренер", "Пакет", "Посещено", "Сумма", "Тренеру", "Оплата"],
      ...rows.map((r) => [
        dmyFull(r.entry_date),
        r.client_name,
        trainerName(r.trainer_id),
        r.package,
        `${r.sessions_used}/${r.sessions_total}`,
        Number(r.amount),
        Math.round(share(r)),
        r.paid ? "оплачено" : "долг",
      ]),
      ["Итого", "", "", "", "", totals.income, Math.round(totals.payout), ""],
    ]);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-12 items-center gap-2 border-b px-3 print:hidden">
        <Dumbbell className="h-4 w-4" />
        <div className="text-sm font-medium">Тренажёрный зал</div>
        <div className="ml-auto flex items-center gap-2">
          {getSection() !== "gym" && (
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
              В автосервис
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Выйти"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <div className="flex gap-1 rounded-md border p-1">
            {([
              ["day", "День"],
              ["week", "Неделя"],
              ["month", "Месяц"],
              ["all", "Всё время"],
            ] as [PeriodKind, string][]).map(([k, label]) => (
              <Button key={k} size="sm" variant={kind === k ? "default" : "ghost"} onClick={() => setKind(k)}>
                {label}
              </Button>
            ))}
          </div>
          {kind !== "all" && (
            <Input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} className="w-[160px]" />
          )}
          <div className="text-sm text-muted-foreground">{periodLabel(kind, from, to)}</div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportEntries}>
              <Download className="mr-1 h-4 w-4" /> Экспорт
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1 h-4 w-4" /> Печать
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat title="Доход" value={money(totals.income)} />
          <Stat title="Тренерам" value={money(totals.payout)} />
          <Stat title="Расходы зала" value={money(totals.spent)} />
          <Stat title="Прибыль зала" value={money(totals.profit)} accent="text-emerald-600" />
          <Stat title="Долг клиентов" value={money(totals.debt)} accent={totals.debt ? "text-amber-600" : undefined} />
        </div>

        <Tabs defaultValue="table">
          <TabsList className="flex w-full justify-start gap-1 overflow-x-auto print:hidden">
            <TabsTrigger value="table" className="shrink-0">Занятия</TabsTrigger>
            <TabsTrigger value="subs" className="shrink-0">Абонементы</TabsTrigger>
            <TabsTrigger value="clients" className="shrink-0">Клиенты</TabsTrigger>
            <TabsTrigger value="trainers" className="shrink-0">Тренеры</TabsTrigger>
            <TabsTrigger value="salary" className="shrink-0">Зарплата</TabsTrigger>
            <TabsTrigger value="payouts" className="shrink-0">Выплаты</TabsTrigger>
            <TabsTrigger value="debts" className="shrink-0">Долги</TabsTrigger>
            <TabsTrigger value="expenses" className="shrink-0">Расходы</TabsTrigger>
            <TabsTrigger value="people" className="shrink-0">Люди</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-3">
            <Card className="print:hidden">
              <CardContent className="space-y-3 p-3">
                <Button className="w-full" size="lg" onClick={() => addEntry.mutate()} disabled={addEntry.isPending}>
                  <Plus className="mr-1 h-4 w-4" /> Добавить занятие
                </Button>
                <div className="grid gap-2 sm:grid-cols-5">
                  <div>
                    <Label>Дата</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Клиент</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Фамилия" />
                    {clientName.trim().length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(clients.data ?? [])
                          .filter(
                            (c) =>
                              c.name.toLowerCase().includes(clientName.trim().toLowerCase()) &&
                              c.name.toLowerCase() !== clientName.trim().toLowerCase(),
                          )
                          .slice(0, 5)
                          .map((c) => (
                            <Button key={c.id} type="button" variant="secondary" size="sm" onClick={() => setClientName(c.name)}>
                              {c.name}
                            </Button>
                          ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Тренер</Label>
                    <Select value={trainerId} onValueChange={setTrainerId}>
                      <SelectTrigger><SelectValue placeholder="Выбрать" /></SelectTrigger>
                      <SelectContent>
                        {(trainers.data ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Пакет</Label>
                    <Select value={pkg} onValueChange={setPkg}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PACKAGES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Сумма</Label>
                    <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
                  </div>
                </div>
                <Button
                  variant={paidNow ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setPaidNow((v) => !v)}
                >
                  {paidNow ? "Оплачено сразу" : "В долг"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2 sm:hidden">
              {rows.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Нет записей за период</p>}
              {rows.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dmy(r.entry_date)}</span>
                      <span className="truncate text-sm">{r.client_name}</span>
                      <span className="ml-auto font-semibold">{money(Number(r.amount))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trainerName(r.trainer_id)} · {r.package} зан. · тренеру {money(share(r))}
                      {Number(r.sessions_total) > 1 && ` · осталось ${Number(r.sessions_total) - Number(r.sessions_used)}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={r.paid ? "secondary" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => togglePaid.mutate({ id: r.id, paid: !r.paid })}
                      >
                        {r.paid ? "Оплачено" : "Не оплачено"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeEntry.mutate(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-md border sm:block">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-2">Число</th>
                    <th className="p-2">Клиент</th>
                    <th className="p-2">Тренер</th>
                    <th className="p-2">Пакет</th>
                    <th className="p-2 text-right">Сумма</th>
                    <th className="p-2 text-right">Тренеру</th>
                    <th className="p-2">Оплата</th>
                    <th className="p-2 print:hidden" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Нет записей за период</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{dmy(r.entry_date)}</td>
                      <td className="p-2">{r.client_name}</td>
                      <td className="p-2">{trainerName(r.trainer_id)}</td>
                      <td className="p-2">
                        {r.package}
                        {Number(r.sessions_total) > 1 && (
                          <span className="text-xs text-muted-foreground"> · {r.sessions_used}/{r.sessions_total}</span>
                        )}
                      </td>
                      <td className="p-2 text-right">{money(Number(r.amount))}</td>
                      <td className="p-2 text-right">{money(share(r))}</td>
                      <td className="p-2">
                        <Button
                          variant={r.paid ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => togglePaid.mutate({ id: r.id, paid: !r.paid })}
                        >
                          {r.paid ? "Оплачено" : "Не оплачено"}
                        </Button>
                      </td>
                      <td className="p-2 text-right print:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeEntry.mutate(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="subs" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Абонементы 8 и 12 занятий. Отмечайте посещение — остаток уменьшается.
            </p>
            {subscriptions.length === 0 && <p className="text-sm text-muted-foreground">Абонементов нет</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {subscriptions.map((r) => {
                const left = Number(r.sessions_total) - Number(r.sessions_used);
                return (
                  <Card key={r.id}>
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.client_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {dmyFull(r.entry_date)} · {trainerName(r.trainer_id)}
                        </span>
                        <span className="ml-auto font-semibold">{money(Number(r.amount))}</span>
                      </div>
                      <div className={left === 0 ? "text-sm font-medium text-destructive" : "text-sm"}>
                        {left === 0 ? "Абонемент закончился — пора продлевать" : `Осталось ${left} из ${r.sessions_total}`}
                      </div>
                      {left <= 2 && left > 0 && (
                        <div className="text-xs text-amber-600">Скоро закончится</div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={left === 0}
                          onClick={() => visit.mutate({ id: r.id, used: Number(r.sessions_used) + 1 })}
                        >
                          Отметить посещение
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={Number(r.sessions_used) === 0}
                          onClick={() => visit.mutate({ id: r.id, used: Number(r.sessions_used) - 1 })}
                        >
                          Отменить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-3">
            {selectedClient ? (
              <ClientDetail
                name={selectedClient}
                entries={(allEntries.data ?? []).filter((r) => r.client_name === selectedClient)}
                trainerName={trainerName}
                onBack={() => setSelectedClient(null)}
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Клиентов: {(clients.data ?? []).length}. Нажмите на клиента, чтобы увидеть историю.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(clients.data ?? []).map((c) => {
                    const list = (allEntries.data ?? []).filter((r) => r.client_name === c.name);
                    const paid = list.filter((r) => r.paid).reduce((a, r) => a + Number(r.amount), 0);
                    const debt = list.filter((r) => !r.paid).reduce((a, r) => a + Number(r.amount), 0);
                    return (
                      <Card key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedClient(c.name)}>
                        <CardContent className="p-3">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Занятий: {list.length} · оплачено {money(paid)}
                            {debt > 0 && <span className="text-amber-600"> · долг {money(debt)}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="trainers" className="space-y-3">
            {selectedTrainer ? (
              (() => {
                const t = (trainers.data ?? []).find((x) => x.id === selectedTrainer);
                if (!t) return null;
                return (
                  <TrainerDetail
                    trainer={t}
                    payouts={(payouts.data ?? []).filter((p) => p.trainer_id === t.id)}
                    onBack={() => setSelectedTrainer(null)}
                  />
                );
              })()
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Тренеров: {(trainers.data ?? []).length}. Нажмите на тренера, чтобы увидеть начисления и выплаты.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(trainers.data ?? []).map((t) => {
                    const list = (payouts.data ?? []).filter((p) => p.trainer_id === t.id);
                    const paidOut = list.filter((p) => p.status === "confirmed").reduce((a, p) => a + Number(p.amount), 0);
                    return (
                      <Card key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTrainer(t.id)}>
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Процент: {t.percent}% · выплат: {list.length} · получено {money(paidOut)}
                            </div>
                          </div>
                          <ChevronLeft className="ml-auto h-4 w-4 rotate-180 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="salary">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-2">Тренер</th>
                    <th className="p-2 text-right">Занятий</th>
                    <th className="p-2 text-right">Сумма</th>
                    <th className="p-2 text-right">Зарплата</th>
                  </tr>
                </thead>
                <tbody>
                  {perTrainer.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Нет данных</td></tr>
                  )}
                  {perTrainer.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-2">{t.name}</td>
                      <td className="p-2 text-right">{t.count}</td>
                      <td className="p-2 text-right">{money(t.sum)}</td>
                      <td className="p-2 text-right font-medium">{money(t.payout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-3">
            {(trainers.data ?? []).map((t) => {
              const accrued = perTrainer.find((p) => p.id === t.id)?.payout ?? 0;
              const list = (payouts.data ?? []).filter(
                (p) => p.trainer_id === t.id && p.paid_at >= from && p.paid_at <= to,
              );
              const paidOut = list.reduce((a, p) => a + Number(p.amount), 0);
              return (
                <PayoutCard
                  key={t.id}
                  trainer={t}
                  accrued={accrued}
                  paidOut={paidOut}
                  payouts={list}
                  periodFrom={from}
                  periodTo={to}
                  onChanged={() => qc.invalidateQueries({ queryKey: ["gym-payouts"] })}
                />
              );
            })}
          </TabsContent>

          <TabsContent value="debts" className="space-y-3">
            <div className="text-sm">
              Неоплаченных занятий: {unpaid.length} на {money(totals.debt)}
            </div>
            <ul className="divide-y rounded-md border">
              {unpaid.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">Долгов нет</li>}
              {unpaid.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 px-2 py-2 text-sm">
                  <span className="whitespace-nowrap">{dmy(r.entry_date)}</span>
                  <span className="font-medium">{r.client_name}</span>
                  <span className="text-muted-foreground">{trainerName(r.trainer_id)}</span>
                  <span className="ml-auto font-semibold text-amber-600">{money(Number(r.amount))}</span>
                  <Button size="sm" onClick={() => togglePaid.mutate({ id: r.id, paid: true })}>
                    Оплачено
                  </Button>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-3">
            <ExpensesTab
              rows={expRows}
              onChanged={() => qc.invalidateQueries({ queryKey: ["gym-expenses"] })}
            />
          </TabsContent>

          <TabsContent value="people" className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Тренеры</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <AddRow
                  placeholder="Имя тренера"
                  onAdd={async (name) => {
                    await createGymTrainer(name);
                    qc.invalidateQueries({ queryKey: ["gym-trainers"] });
                  }}
                />
                {(trainers.data ?? []).map((t) => (
                  <TrainerRow key={t.id} trainer={t} onChanged={() => qc.invalidateQueries({ queryKey: ["gym-trainers"] })} />
                ))}
              </CardContent>
            </Card>
            <PeopleCard
              title="Клиенты"
              items={(clients.data ?? []).map((c) => ({ id: c.id, label: c.name }))}
              onAdd={async (name) => { await createGymClient(name); qc.invalidateQueries({ queryKey: ["gym-clients"] }); }}
              onDelete={async (id) => { await deleteGymClient(id); qc.invalidateQueries({ queryKey: ["gym-clients"] }); }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EditEntryDialog
        entry={editing}
        trainers={trainers.data ?? []}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          invalidate();
        }}
      />
    </div>
  );
}

function Stat({ title, value, accent }: { title: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className={`text-2xl font-semibold ${accent ?? ""}`}>{value}</CardContent>
    </Card>
  );
}

function EditEntryDialog({
  entry,
  trainers,
  onClose,
  onSaved,
}: {
  entry: GymEntry | null;
  trainers: GymTrainer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState("");
  const [client, setClient] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [pkg, setPkg] = useState("1");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setDate(entry.entry_date);
    setClient(entry.client_name);
    setTrainerId(entry.trainer_id ?? "");
    setPkg(entry.package);
    setAmount(String(Number(entry.amount)));
  }, [entry]);

  async function save() {
    if (!entry) return;
    const sum = Number(amount.replace(",", "."));
    if (!Number.isFinite(sum) || sum <= 0) {
      toast.error("Укажите сумму");
      return;
    }
    if (!trainerId) {
      toast.error("Выберите тренера");
      return;
    }
    setBusy(true);
    try {
      const percent = trainers.find((t) => t.id === trainerId)?.percent ?? entry.trainer_percent;
      const total = Number(pkg) || 1;
      await updateGymEntry(entry.id, {
        entry_date: date,
        client_name: client.trim() || entry.client_name,
        trainer_id: trainerId,
        package: pkg,
        amount: sum,
        trainer_percent: percent,
        sessions_total: total,
        sessions_used: Math.min(Number(entry.sessions_used), total),
      });
      savePrice(pkg, sum);
      toast.success("Сохранено");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!entry} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Изменить занятие</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div>
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Клиент</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <div>
            <Label>Тренер</Label>
            <Select value={trainerId} onValueChange={setTrainerId}>
              <SelectTrigger><SelectValue placeholder="Выбрать" /></SelectTrigger>
              <SelectContent>
                {trainers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Пакет</Label>
            <Select value={pkg} onValueChange={setPkg}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PACKAGES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Сумма</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button className="w-full" onClick={save} disabled={busy}>Сохранить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExpensesTab({
  rows,
  onChanged,
}: {
  rows: { id: string; expense_date: string; title: string; amount: number; note: string | null }[];
  onChanged: () => void;
}) {
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const total = rows.reduce((a, r) => a + Number(r.amount), 0);

  async function add() {
    const sum = Number(amount.replace(",", "."));
    if (!title.trim()) return toast.error("Укажите, на что потрачено");
    if (!Number.isFinite(sum) || sum <= 0) return toast.error("Укажите сумму");
    setBusy(true);
    try {
      await createGymExpense({ expense_date: date, title: title.trim(), amount: sum, note: null });
      setTitle("");
      setAmount("");
      onChanged();
      toast.success("Расход добавлен");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Расходы зала за период: {money(total)}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <div>
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>На что</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Аренда, вода, инвентарь" />
          </div>
          <div>
            <Label>Сумма</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
        </div>
        <Button onClick={add} disabled={busy}><Plus className="mr-1 h-4 w-4" /> Добавить расход</Button>
        <ul className="divide-y rounded-md border">
          {rows.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">Расходов за период нет</li>}
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
              <span className="whitespace-nowrap">{dmy(r.expense_date)}</span>
              <span className="truncate">{r.title}</span>
              <span className="ml-auto font-medium">{money(Number(r.amount))}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await deleteGymExpense(r.id);
                  onChanged();
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ClientDetail({
  name,
  entries,
  trainerName,
  onBack,
}: {
  name: string;
  entries: GymEntry[];
  trainerName: (id: string | null) => string;
  onBack: () => void;
}) {
  const paid = entries.filter((r) => r.paid).reduce((a, r) => a + Number(r.amount), 0);
  const debt = entries.filter((r) => !r.paid).reduce((a, r) => a + Number(r.amount), 0);
  const left = entries.reduce((a, r) => a + Math.max(0, Number(r.sessions_total) - Number(r.sessions_used)), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Все клиенты
        </Button>
        <div className="font-medium">{name}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat title="Оплачено всего" value={money(paid)} />
        <Stat title="Долг" value={money(debt)} accent={debt ? "text-amber-600" : undefined} />
        <Stat title="Осталось занятий" value={String(left)} />
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">История занятий</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y rounded-md border">
            {entries.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">Занятий нет</li>}
            {entries.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-sm">
                <span className="whitespace-nowrap">{dmyFull(r.entry_date)}</span>
                <span>{trainerName(r.trainer_id)}</span>
                <span className="text-muted-foreground">
                  {r.package} зан.{Number(r.sessions_total) > 1 ? ` · посещено ${r.sessions_used}/${r.sessions_total}` : ""}
                </span>
                <span className="ml-auto font-medium">{money(Number(r.amount))}</span>
                {!r.paid && <span className="text-xs text-amber-600">долг</span>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutCard({
  trainer,
  accrued,
  paidOut,
  payouts,
  periodFrom,
  periodTo,
  onChanged,
}: {
  trainer: GymTrainer;
  accrued: number;
  paidOut: number;
  payouts: { id: string; amount: number; paid_at: string; status: string; confirmed_at: string | null; note: string | null }[];
  periodFrom: string;
  periodTo: string;
  onChanged: () => void;
}) {
  const rest = accrued - paidOut;
  const [sum, setSum] = useState("");
  const [day, setDay] = useState(today);
  const [busy, setBusy] = useState(false);

  async function pay() {
    const value = Number(sum.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Укажите сумму выплаты");
      return;
    }
    setBusy(true);
    try {
      await createGymPayout({
        trainer_id: trainer.id,
        amount: value,
        paid_at: day,
        period_from: periodFrom,
        period_to: periodTo,
      });
      setSum("");
      onChanged();
      toast.success("Выплата отправлена тренеру на подтверждение");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{trainer.name}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div><div className="text-muted-foreground">Начислено</div><div className="font-semibold">{money(accrued)}</div></div>
          <div><div className="text-muted-foreground">Выплачено</div><div className="font-semibold">{money(paidOut)}</div></div>
          <div><div className="text-muted-foreground">Остаток</div><div className="font-semibold text-emerald-600">{money(rest)}</div></div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[150px]">
            <Label>Дата</Label>
            <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
          <div className="w-[130px]">
            <Label>Сумма</Label>
            <Input inputMode="decimal" value={sum} onChange={(e) => setSum(e.target.value)} placeholder="0" />
          </div>
          <Button onClick={pay} disabled={busy}>Выплатить</Button>
        </div>
        <ul className="divide-y rounded-md border">
          {payouts.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">Выплат за период нет</li>}
          {payouts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-sm">
              <span className="whitespace-nowrap">{dmy(p.paid_at)}</span>
              <span className="font-medium">{money(Number(p.amount))}</span>
              {p.status === "confirmed" ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> подтверждено
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <Clock className="h-4 w-4" /> ждёт подтверждения
                </span>
              )}
              <div className="ml-auto flex items-center gap-1">
                {p.status !== "confirmed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await confirmGymPayout(p.id);
                      onChanged();
                    }}
                  >
                    Отметить полученной
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await deleteGymPayout(p.id);
                    onChanged();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TrainerRow({ trainer, onChanged }: { trainer: GymTrainer; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(trainer.login ?? "");
  const [password, setPassword] = useState(trainer.password ?? "");
  const [percent, setPercent] = useState(String(trainer.percent));

  return (
    <div className="rounded-md border p-2">
      <div className="flex items-center gap-2">
        <button type="button" className="min-w-0 flex-1 text-left text-sm" onClick={() => setOpen((v) => !v)}>
          {trainer.name} — {trainer.percent}%{trainer.login ? ` · ${trainer.login}` : " · без входа"}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            await deleteGymTrainer(trainer.id);
            onChanged();
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <Label>Логин</Label>
              <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="ivan" />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="1234" />
            </div>
            <div>
              <Label>Процент</Label>
              <Input inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} />
            </div>
          </div>
          <Button
            size="sm"
            onClick={async () => {
              const p = Number(percent.replace(",", "."));
              if (!Number.isFinite(p) || p < 0 || p > 100) {
                toast.error("Процент должен быть от 0 до 100");
                return;
              }
              try {
                await updateGymTrainer(trainer.id, {
                  login: login.trim() || null,
                  password: password.trim() || null,
                  percent: p,
                });
                onChanged();
                toast.success("Сохранено");
              } catch {
                toast.error("Такой логин уже занят");
              }
            }}
          >
            Сохранить
          </Button>
        </div>
      )}
    </div>
  );
}

type TrainerPayout = {
  id: string;
  amount: number;
  paid_at: string;
  status: string;
  confirmed_at: string | null;
  note: string | null;
};

function TrainerDetail({
  trainer,
  payouts,
  onBack,
}: {
  trainer: GymTrainer;
  payouts: TrainerPayout[];
  onBack: () => void;
}) {
  const entries = useQuery({
    queryKey: ["gym-trainer-entries", trainer.id],
    queryFn: () => listTrainerEntries(trainer.id),
  });

  const all = entries.data ?? [];
  const paidRows = all.filter((r) => r.paid);
  const accrued = paidRows.reduce((a, r) => a + share(r), 0);
  const received = payouts.filter((p) => p.status === "confirmed").reduce((a, p) => a + Number(p.amount), 0);
  const pending = payouts.filter((p) => p.status !== "confirmed").reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Все тренеры
        </Button>
        <div className="font-medium">{trainer.name} · {trainer.percent}%</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat title="Начислено за всё время" value={money(accrued)} />
        <Stat title="Получил всего" value={money(received)} />
        <Stat title="Ждёт подтверждения" value={money(pending)} accent={pending ? "text-amber-600" : undefined} />
        <Stat title="К выдаче" value={money(accrued - received - pending)} accent="text-emerald-600" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Выплаты — когда и сколько получил</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y rounded-md border">
            {payouts.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">Выплат ещё не было</li>}
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-sm">
                <span className="whitespace-nowrap">{dmyFull(p.paid_at)}</span>
                <span className="font-medium">{money(Number(p.amount))}</span>
                {p.status === "confirmed" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    получено{p.confirmed_at ? ` ${new Date(p.confirmed_at).toLocaleDateString("ru-RU")}` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Clock className="h-4 w-4" /> ждёт подтверждения
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Начисления — все тренировки</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y rounded-md border">
            {all.length === 0 && (
              <li className="px-2 py-2 text-sm text-muted-foreground">
                {entries.isLoading ? "Загрузка…" : "Занятий нет"}
              </li>
            )}
            {all.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-sm">
                <span className="whitespace-nowrap">{dmy(r.entry_date)}</span>
                <span className="truncate">{r.client_name}</span>
                <span className="text-muted-foreground">{r.package} зан.</span>
                <span className="ml-auto">{money(Number(r.amount))}</span>
                <span className="font-medium">
                  тренеру {money(share(r))} ({Number(r.trainer_percent)}%)
                </span>
                {!r.paid && <span className="text-xs text-amber-600">не оплачено</span>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = name.trim();
    if (!value) {
      toast.error("Впишите имя");
      return;
    }
    setBusy(true);
    try {
      await onAdd(value);
      setName("");
      toast.success(`Добавлено: ${value}`);
    } catch (e) {
      toast.error((e as Error).message || "Не удалось добавить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={placeholder}
      />
      <Button onClick={submit} disabled={busy}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PeopleCard({
  title,
  items,
  onAdd,
  onDelete,
}: {
  title: string;
  items: { id: string; label: string }[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <AddRow placeholder="Имя" onAdd={onAdd} />
        <ul className="divide-y rounded-md border">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span>{i.label}</span>
              <Button variant="ghost" size="icon" onClick={() => onDelete(i.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
