import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, UserCog, Wallet, CalendarClock, ArrowLeft, ChevronDown, ChevronRight, Percent, BadgeDollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createMechanic, createMechanicShift, deleteMechanic, deleteMechanicShift,
  listMechanicPayouts, listMechanicServiceRates, listMechanicShifts, listMechanics,
  listServices, updateMechanic, upsertMechanicServiceRate,
} from "@/lib/api";
import type { Mechanic, MechanicShift } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#78716c", "#0f172a", "#64748b",
  "#7c2d12", "#166534", "#1e3a8a", "#4a044e",
];

export const Route = createFileRoute("/mechanics")({
  ssr: false,
  component: MechanicsPage,
});

function MechanicsPage() {
  const qc = useQueryClient();
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ open: boolean; editing: Mechanic | null }>({
    open: false, editing: null,
  });
  const [form, setForm] = useState({ full_name: "", specialization: "", phone: "", color: COLORS[0] });

  const openNew = () => {
    setDialog({ open: true, editing: null });
    setForm({ full_name: "", specialization: "", phone: "", color: COLORS[mechanics.length % COLORS.length] });
  };
  const openEdit = (m: Mechanic) => {
    setDialog({ open: true, editing: m });
    setForm({
      full_name: m.full_name,
      specialization: m.specialization ?? "",
      phone: m.phone ?? "",
      color: m.color,
    });
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Введите ФИО");
      const payload = {
        full_name: form.full_name.trim(),
        specialization: form.specialization.trim() || null,
        phone: form.phone.trim() || null,
        color: form.color,
      };
      if (dialog.editing) {
        await updateMechanic(dialog.editing.id, payload);
        return dialog.editing.id;
      }
      const c = (await createMechanic(payload)) as unknown as { id: string };
      return c.id;
    },
    onSuccess: (id) => {
      toast.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["mechanics"] });
      setDialog({ open: false, editing: null });
      setSelectedId(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteMechanic(id),
    onSuccess: () => {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["mechanics"] });
      setSelectedId(null);
    },
  });

  const selected = mechanics.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col md:h-[calc(100vh-3rem)] md:flex-row">
      <aside className={`w-full flex-col border-r bg-muted/30 md:flex md:w-72 ${selected ? "hidden md:flex" : "flex"}`}>

        <div className="flex items-center justify-between border-b p-3">
          <div className="font-semibold">Мастера</div>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" />Добавить
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {mechanics.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Пока нет мастеров</div>
          )}
          {mechanics.map((m) => {
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className="flex w-full items-center gap-3 border-b border-l-4 px-3 py-2.5 text-left text-sm transition hover:bg-muted/60"
                style={{
                  borderLeftColor: m.color,
                  background: active ? `${m.color}22` : undefined,
                }}
              >
                <span className="h-4 w-4 shrink-0 rounded" style={{ background: m.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.specialization ?? "—"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className={`flex-1 overflow-auto p-4 md:p-6 ${!selected ? "hidden md:block" : "block"}`}>
        {!selected ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <UserCog className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <div>Выберите мастера слева или добавьте нового</div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-8">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
            >
              <ArrowLeft className="h-4 w-4" /> К списку мастеров
            </button>

            <div
              className="flex flex-col items-start gap-3 rounded-lg border-l-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              style={{ borderLeftColor: selected.color, background: `${selected.color}10` }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-4 w-4 shrink-0 rounded"
                    style={{ background: selected.color }}
                  />
                  <h1 className="truncate text-xl font-bold sm:text-2xl">{selected.full_name}</h1>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  <span>{selected.specialization ?? "—"}</span>
                  {selected.phone && <span>· {selected.phone}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                  <Pencil className="mr-1 h-4 w-4" />Изменить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Удалить мастера «${selected.full_name}»?`)) delM.mutate(selected.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <MechanicSalary mechanicId={selected.id} />
            <MechanicRates mechanicId={selected.id} />
            <MechanicShifts mechanicId={selected.id} color={selected.color} />
          </div>
        )}
      </section>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Редактировать мастера" : "Новый мастер"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>ФИО</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Специализация</Label>
              <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Цвет в календаре</Label>
              <div className="mt-2 grid grid-cols-8 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-md border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Отмена</Button>
            <Button onClick={() => saveM.mutate()}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= SALARY =================
type Period = "today" | "week" | "month" | "all";
const PERIOD_LABELS: Record<Period, string> = {
  today: "Сегодня",
  week: "Неделя",
  month: "Месяц",
  all: "Всё время",
};

function periodStart(p: Period): number {
  const now = new Date();
  if (p === "all") return 0;
  if (p === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (p === "week") return now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return now.getTime() - 30 * 24 * 60 * 60 * 1000;
}

function MechanicSalary({ mechanicId }: { mechanicId: string }) {
  const { data: rows = [] } = useQuery({
    queryKey: ["mechanic-payouts", mechanicId],
    queryFn: () => listMechanicPayouts(mechanicId),
  });
  const [period, setPeriod] = useState<Period>("month");

  const filtered = useMemo(() => {
    const start = periodStart(period);
    return rows.filter((r) => r.status === "done" && new Date(r.starts_at).getTime() >= start);
  }, [rows, period]);

  const pending = useMemo(
    () => rows.filter((r) => r.status !== "done" && r.status !== "cancelled"),
    [rows],
  );

  const total = filtered.reduce((s, r) => s + r.mechanic_payout, 0);
  const pendingTotal = pending.reduce((s, r) => s + r.mechanic_payout, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Зарплата</h2>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-32 sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">Заработано ({PERIOD_LABELS[period].toLowerCase()})</div>
          <div className="mt-1 text-2xl font-bold">{total.toLocaleString("ru-RU")} ₽</div>
          <div className="mt-1 text-xs text-muted-foreground">{filtered.length} услуг</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">Ожидает (в работе / запланировано)</div>
          <div className="mt-1 text-2xl font-bold">{pendingTotal.toLocaleString("ru-RU")} ₽</div>
          <div className="mt-1 text-xs text-muted-foreground">{pending.length} услуг</div>
        </div>
      </div>
      {filtered.length > 0 && (
        <div className="mt-3 space-y-1">
          {filtered.slice(0, 20).map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded border bg-card px-3 py-1.5 text-xs">
              <div>
                <span className="font-medium">{r.service_name ?? "—"}</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(r.starts_at).toLocaleDateString("ru-RU")} · {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status}
                </span>
              </div>
              <div className="font-semibold">{r.mechanic_payout} ₽</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================= RATES =================
function MechanicRates({ mechanicId }: { mechanicId: string }) {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });
  const { data: rates = [] } = useQuery({
    queryKey: ["mechanic-service-rates", mechanicId],
    queryFn: () => listMechanicServiceRates(mechanicId),
  });
  const rateFor = (svcId: string) => rates.find((r) => r.service_id === svcId)?.amount ?? 0;

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const saveM = useMutation({
    mutationFn: async ({ service_id, amount }: { service_id: string; amount: number }) => {
      await upsertMechanicServiceRate(mechanicId, service_id, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mechanic-service-rates", mechanicId] });
      toast.success("Ставка сохранена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <UserCog className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Ставки за услуги</h2>
      </div>
      {services.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          Сначала добавьте услуги в «Настройках калькулятора»
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {services.map((s) => {
            const draftKey = s.id;
            const current = rateFor(s.id);
            const value = drafts[draftKey] ?? String(current);
            return (
              <div key={s.id} className="flex items-center gap-3 border-b p-2 last:border-b-0">
                <div className="min-w-0 flex-1 text-sm">
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.category} · клиенту {s.base_price} ₽
                  </div>
                </div>
                <Input
                  type="number"
                  className="h-8 w-28"
                  value={value}
                  onChange={(e) => setDrafts((d) => ({ ...d, [draftKey]: e.target.value }))}
                  onBlur={() => {
                    const n = Number(value);
                    if (Number.isFinite(n) && n !== current) {
                      saveM.mutate({ service_id: s.id, amount: n });
                    }
                    setDrafts((d) => {
                      const { [draftKey]: _, ...rest } = d;
                      return rest;
                    });
                  }}
                />
                <span className="text-xs text-muted-foreground">₽</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================= SHIFTS =================
function MechanicShifts({ mechanicId, color = "#64748b" }: { mechanicId: string; color?: string }) {
  const qc = useQueryClient();
  const { data: shifts = [] } = useQuery({
    queryKey: ["mechanic-shifts", mechanicId],
    queryFn: () => listMechanicShifts(mechanicId),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, MechanicShift[]>();
    for (const s of shifts) {
      const d = new Date(s.starts_at);
      const day = d.getDay(); // 0=Sun
      const monOffset = (day + 6) % 7; // shift so Monday=0
      const monday = new Date(d);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(monday.getDate() - monOffset);
      const key = monday.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [shifts]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MechanicShift | null>(null);
  const [form, setForm] = useState({ start: "", end: "", note: "" });

  const openNew = () => {
    setEditing(null);
    const now = new Date();
    const d = now.toISOString().slice(0, 10);
    setForm({ start: `${d}T09:00`, end: `${d}T18:00`, note: "" });
    setOpen(true);
  };
  const openEdit = (s: MechanicShift) => {
    setEditing(s);
    setForm({
      start: new Date(s.starts_at).toISOString().slice(0, 16),
      end: new Date(s.ends_at).toISOString().slice(0, 16),
      note: s.note ?? "",
    });
    setOpen(true);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["mechanic-shifts", mechanicId] });

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.start || !form.end) throw new Error("Укажите время начала и окончания");
      const starts_at = new Date(form.start).toISOString();
      const ends_at = new Date(form.end).toISOString();
      if (new Date(ends_at).getTime() <= new Date(starts_at).getTime()) {
        throw new Error("Конец должен быть позже начала");
      }
      const payload = { mechanic_id: mechanicId, starts_at, ends_at, note: form.note.trim() || null };
      if (editing) {
        const { updateMechanicShift } = await import("@/lib/api");
        await updateMechanicShift(editing.id, payload);
      } else {
        await createMechanicShift(payload);
      }
    },
    onSuccess: () => { toast.success("Сохранено"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteMechanicShift(id),
    onSuccess: () => { toast.success("Удалено"); invalidate(); },
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            График смен{" "}
            <span className="text-sm font-normal text-muted-foreground">· {shifts.length}</span>
          </h2>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" />Смена
        </Button>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            График работы{" "}
            <span className="text-sm font-normal text-muted-foreground">· {shifts.length}</span>
          </h2>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" />Смена
        </Button>
      </div>
      {shifts.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          Смен пока нет
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([weekKey, weekShifts]) => {
            const weekStart = new Date(weekKey);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const totalMin = weekShifts.reduce(
              (s, sh) =>
                s +
                Math.round(
                  (new Date(sh.ends_at).getTime() - new Date(sh.starts_at).getTime()) / 60000,
                ),
              0,
            );
            const totalH = Math.round((totalMin / 60) * 10) / 10;
            return (
              <div key={weekKey}>
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                  <span>
                    Неделя с{" "}
                    {weekStart.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                    {" – "}
                    {weekEnd.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                  </span>
                  <span>Всего: {totalH} ч</span>
                </div>
                <div className="space-y-2">
                  {weekShifts.map((s) => {
                    const start = new Date(s.starts_at);
                    const end = new Date(s.ends_at);
                    const past = end.getTime() < Date.now();
                    const durH =
                      Math.round(((end.getTime() - start.getTime()) / 3600000) * 10) / 10;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between rounded-lg border border-l-4 bg-card p-3 text-sm ${
                          past ? "opacity-60" : ""
                        }`}
                        style={{
                          borderLeftColor: color,
                          background: past ? undefined : `${color}0d`,
                        }}
                      >
                        <div>
                          <div className="font-medium">
                            {start.toLocaleDateString("ru-RU", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                            {" · "}
                            {start.toLocaleTimeString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" – "}
                            {end.toLocaleTimeString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {durH} ч
                            </span>
                          </div>
                          {s.note && (
                            <div className="text-xs text-muted-foreground">{s.note}</div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Удалить смену?")) delM.mutate(s.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать смену" : "Новая смена"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Начало</Label>
              <Input
                type="datetime-local"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </div>
            <div>
              <Label>Конец</Label>
              <Input
                type="datetime-local"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
            <div>
              <Label>Заметка</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Необязательно"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={() => saveM.mutate()} disabled={saveM.isPending}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
