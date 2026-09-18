import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, LogOut, Plus, Trash2 } from "lucide-react";
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
import { logout } from "@/lib/authGate";
import {
  createGymClient,
  createGymEntry,
  createGymTrainer,
  deleteGymClient,
  deleteGymEntry,
  deleteGymTrainer,
  listGymClients,
  listGymEntries,
  listGymTrainers,
  updateGymEntry,
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

function GymPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const { from, to } = monthRange(month);

  const trainers = useQuery({ queryKey: ["gym-trainers"], queryFn: listGymTrainers });
  const clients = useQuery({ queryKey: ["gym-clients"], queryFn: listGymClients });
  const entries = useQuery({ queryKey: ["gym-entries", from, to], queryFn: () => listGymEntries(from, to) });

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState("");
  const [trainerId, setTrainerId] = useState<string>("");
  const [pkg, setPkg] = useState("1");
  const [amount, setAmount] = useState("");

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
    const sum = rows.reduce((a, r) => a + Number(r.amount), 0);
    const payout = rows.reduce((a, r) => a + (Number(r.amount) * Number(r.trainer_percent)) / 100, 0);
    return { sum, payout, profit: sum - payout };
  }, [rows]);

  const perTrainer = useMemo(() => {
    const map = new Map<string, { name: string; sum: number; payout: number; count: number }>();
    for (const r of rows) {
      const key = r.trainer_id ?? "none";
      const cur = map.get(key) ?? { name: trainerName(r.trainer_id), sum: 0, payout: 0, count: 0 };
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
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
            В автосервис
          </Button>
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
            <CardHeader className="pb-2"><CardTitle className="text-sm">Тренерам</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{money(totals.payout)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Залу остаётся</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-600">{money(totals.profit)}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Таблица</TabsTrigger>
            <TabsTrigger value="salary">Зарплата</TabsTrigger>
            <TabsTrigger value="people">Тренеры и клиенты</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Добавить занятие</CardTitle></CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-6">
                <div>
                  <Label>Дата</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Клиент</Label>
                  <Input
                    list="gym-clients"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Фамилия"
                  />
                  <datalist id="gym-clients">
                    {(clients.data ?? []).map((c) => <option key={c.id} value={c.name} />)}
                  </datalist>
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
                <div className="sm:col-span-6">
                  <Button onClick={() => addEntry.mutate()} disabled={addEntry.isPending}>
                    <Plus className="mr-1 h-4 w-4" /> Добавить
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="overflow-x-auto rounded-md border">
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
                      <td className="p-2 whitespace-nowrap">{r.entry_date.slice(8, 10)}.{r.entry_date.slice(5, 7)}</td>
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
                      <td className="p-2 text-right">
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

          <TabsContent value="people" className="grid gap-3 sm:grid-cols-2">
            <PeopleCard
              title="Тренеры"
              items={(trainers.data ?? []).map((t) => ({ id: t.id, label: `${t.name} — ${t.percent}%` }))}
              onAdd={async (name) => { await createGymTrainer(name); qc.invalidateQueries({ queryKey: ["gym-trainers"] }); }}
              onDelete={async (id) => { await deleteGymTrainer(id); qc.invalidateQueries({ queryKey: ["gym-trainers"] }); }}
            />
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
  const [name, setName] = useState("");
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" />
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
