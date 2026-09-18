import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, Clock, Dumbbell, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  createGymPayout,
  createGymTrainer,
  deleteGymClient,
  deleteGymEntry,
  deleteGymPayout,
  deleteGymTrainer,
  listGymClients,
  listGymEntries,
  listGymPayouts,
  listGymTrainers,
  listTrainerEntries,
  updateGymEntry,
  updateGymTrainer,
  type GymTrainer,
} from "@/lib/gymApi";

export const Route = createFileRoute("/gym")({
  component: GymPage,
  head: () => ({
    meta: [
      { title: "Samson Fit — тренажёрный зал" },
      { name: "description", content: "Учёт занятий, клиентов и зарплаты тренеров тренажёрного зала." },
      { property: "og:title", content: "Samson Fit — тренажёрный зал" },
      { property: "og:description", content: "Учёт занятий, клиентов и зарплаты тренеров тренажёрного зала." },
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

function money(n: number) {
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from, to: `${month}-${String(last).padStart(2, "0")}` };
}

function dmy(d: string) {
  return `${d.slice(8, 10)}.${d.slice(5, 7)}`;
}

function GymPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const { from, to } = monthRange(month);

  const trainers = useQuery({ queryKey: ["gym-trainers"], queryFn: listGymTrainers });
  const clients = useQuery({ queryKey: ["gym-clients"], queryFn: listGymClients });
  const entries = useQuery({ queryKey: ["gym-entries", from, to], queryFn: () => listGymEntries(from, to) });
  const payouts = useQuery({ queryKey: ["gym-payouts"], queryFn: () => listGymPayouts() });

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState("");
  const [trainerId, setTrainerId] = useState<string>("");
  const [pkg, setPkg] = useState("1");
  const [amount, setAmount] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["gym-entries"] });
    qc.invalidateQueries({ queryKey: ["gym-clients"] });
  };

  const addEntry = useMutation({
    mutationFn: async () => {
      const name = clientName.trim();
      if (!name) throw new Error("Укажите клиента");
      const sum = Number(amount.replace(",", "."));
      if (!Number.isFinite(sum) || sum < 0) throw new Error("Укажите сумму");
      const trainer = trainers.data?.find((t) => t.id === trainerId);
      let client = clients.data?.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!client) client = await createGymClient(name);
      await createGymEntry({
        entry_date: date,
        trainer_id: trainerId || null,
        client_id: client.id,
        client_name: name,
        package: pkg,
        amount: sum,
        trainer_percent: trainer?.percent ?? 80,
        paid: true,
        note: null,
      });
    },
    onSuccess: () => {
      setClientName("");
      setAmount("");
      invalidate();
      toast.success("Запись добавлена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeEntry = useMutation({
    mutationFn: (id: string) => deleteGymEntry(id),
    onSuccess: invalidate,
  });

  const togglePaid = useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) => updateGymEntry(id, { paid }),
    onSuccess: invalidate,
  });

  const rows = entries.data ?? [];
  const trainerName = (id: string | null) => trainers.data?.find((t) => t.id === id)?.name ?? "—";

  const totals = useMemo(() => {
    const paidRows = rows.filter((r) => r.paid);
    const sum = paidRows.reduce((a, r) => a + Number(r.amount), 0);
    const payout = paidRows.reduce((a, r) => a + (Number(r.amount) * Number(r.trainer_percent)) / 100, 0);
    return { sum, payout, profit: sum - payout };
  }, [rows]);

  const perTrainer = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sum: number; payout: number; count: number }>();
    for (const r of rows) {
      if (!r.paid) continue;
      const key = r.trainer_id ?? "none";
      const cur = map.get(key) ?? { id: key, name: trainerName(r.trainer_id), sum: 0, payout: 0, count: 0 };
      cur.sum += Number(r.amount);
      cur.payout += (Number(r.amount) * Number(r.trainer_percent)) / 100;
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.sum - a.sum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, trainers.data]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-12 items-center gap-2 border-b px-3">
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
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="month">Месяц</Label>
            <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[170px]" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Сумма за месяц</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{money(totals.sum)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Тренерам (80%)</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{money(totals.payout)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Залу остаётся</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-600">{money(totals.profit)}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="table">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="table" className="flex-1">Занятия</TabsTrigger>
            <TabsTrigger value="trainers" className="flex-1">Тренеры</TabsTrigger>
            <TabsTrigger value="salary" className="flex-1">Зарплата</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1">Выплаты</TabsTrigger>
            <TabsTrigger value="people" className="flex-1">Люди</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-3">
            <Card>
              <CardContent className="space-y-3 p-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => addEntry.mutate()}
                  disabled={addEntry.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" /> Добавить занятие
                </Button>
                <div className="grid gap-2 sm:grid-cols-5">
                  <div>
                    <Label>Дата</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Клиент</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Фамилия"
                    />
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
                            <Button
                              key={c.id}
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setClientName(c.name)}
                            >
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
              </CardContent>
            </Card>

            {/* Мобильные карточки */}
            <div className="space-y-2 sm:hidden">
              {rows.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Нет записей за этот месяц</p>
              )}
              {rows.map((r) => (
                <Card key={r.id}>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dmy(r.entry_date)}</span>
                      <span className="truncate text-sm">{r.client_name}</span>
                      <span className="ml-auto font-semibold">{money(Number(r.amount))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trainerName(r.trainer_id)} · {r.package} зан. · тренеру{" "}
                      {money((Number(r.amount) * Number(r.trainer_percent)) / 100)}
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
                      <Button variant="ghost" size="icon" onClick={() => removeEntry.mutate(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-md border sm:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-2">Число</th>
                    <th className="p-2">Клиент</th>
                    <th className="p-2">Тренер</th>
                    <th className="p-2">Занятий</th>
                    <th className="p-2 text-right">Сумма</th>
                    <th className="p-2 text-right">Тренеру</th>
                    <th className="p-2">Оплата</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Нет записей за этот месяц</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{dmy(r.entry_date)}</td>
                      <td className="p-2">{r.client_name}</td>
                      <td className="p-2">{trainerName(r.trainer_id)}</td>
                      <td className="p-2">{r.package}</td>
                      <td className="p-2 text-right">{money(Number(r.amount))}</td>
                      <td className="p-2 text-right">{money((Number(r.amount) * Number(r.trainer_percent)) / 100)}</td>
                      <td className="p-2">
                        <Button
                          variant={r.paid ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => togglePaid.mutate({ id: r.id, paid: !r.paid })}
                        >
                          {r.paid ? "Оплачено" : "Не оплачено"}
                        </Button>
                      </td>
                      <td className="p-2 pl-6 text-right">
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
                  Тренеров: {(trainers.data ?? []).length}. Нажмите на тренера, чтобы увидеть его начисления и выплаты.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(trainers.data ?? []).map((t) => {
                    const list = (payouts.data ?? []).filter((p) => p.trainer_id === t.id);
                    const paidOut = list.reduce((a, p) => a + Number(p.amount), 0);
                    return (
                      <Card
                        key={t.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => setSelectedTrainer(t.id)}
                      >
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Процент: {t.percent}% · выплат: {list.length} · выдано {money(paidOut)}
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
                    <tr key={t.name} className="border-t">
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
                  <TrainerRow
                    key={t.id}
                    trainer={t}
                    onChanged={() => qc.invalidateQueries({ queryKey: ["gym-trainers"] })}
                  />
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
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
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
          {payouts.length === 0 && (
            <li className="px-2 py-2 text-sm text-muted-foreground">Выплат за период нет</li>
          )}
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

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  return (
    <div className="flex gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} />
      <Button
        onClick={async () => {
          if (!name.trim()) return;
          await onAdd(name.trim());
          setName("");
        }}
      >
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
