import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { isTodayUss, isTomorrowUss, isYesterdayUss, ussDayKey, ussDateISO } from "@/lib/tz";
import { ru } from "date-fns/locale";
import { Check, ChevronDown, Plus, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAppointments,
  listMechanics,
  createAppointmentPayment,
  clearAppointmentPayments,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/lib/api";
import {
  PAYMENT_COLORS,
  PAYMENT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type AppointmentStatus,
  type PaymentStatus,
} from "@/lib/types";

import { AppointmentDialog } from "@/components/AppointmentDialog";
import { PrintDocument, type PrintKV } from "@/components/PrintDocument";
import { useConfirm } from "@/components/ConfirmDialog";
import type { AppointmentWithRelations } from "@/lib/api";

export const Route = createFileRoute("/schedule")({
  ssr: false,
  component: SchedulePage,
});

type SortMode = "day-desc" | "day-asc" | "time-desc" | "time-asc";
const SORT_LABELS: Record<SortMode, string> = {
  "day-desc": "Сначала новые дни",
  "day-asc": "Сначала старые дни",
  "time-desc": "По времени: позже → раньше",
  "time-asc": "По времени: раньше → позже",
};

const STATUS_STRIPE: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-400",
  in_progress: "bg-amber-400",
  done: "bg-green-500",
  cancelled: "bg-gray-300",
};

function relativeDayLabel(d: Date): string | null {
  if (isTodayUss(d)) return "Сегодня";
  if (isTomorrowUss(d)) return "Завтра";
  if (isYesterdayUss(d)) return "Вчера";
  return null;
}

function SchedulePage() {
  const qc = useQueryClient();
  const confirmAction = useConfirm();
  const [mechanicFilter, setMechanicFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window === "undefined") return "day-desc";
    const v = window.localStorage.getItem("schedule.sort") as SortMode | null;
    return v && v in SORT_LABELS ? v : "day-desc";
  });
  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [printApptId, setPrintApptId] = useState<string | null>(null);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });

  const [payDlg, setPayDlg] = useState<{
    open: boolean;
    id: string | null;
    total: number;
    paid: number;
    paid_at: string;
    amount: string;
    note: string;
  }>({ open: false, id: null, total: 0, paid: 0, paid_at: "", amount: "", note: "" });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addPayMut = useMutation({
    mutationFn: (v: {
      appointment_id: string;
      paid_at: string;
      amount: number;
      note?: string | null;
    }) =>
      createAppointmentPayment({
        appointment_id: v.appointment_id,
        paid_at: v.paid_at,
        amount: v.amount,
        note: v.note ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointment-payments"] });
      qc.invalidateQueries({ queryKey: ["payments-range"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearPayMut = useMutation({
    mutationFn: (id: string) => clearAppointmentPayments(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointment-payments"] });
      qc.invalidateQueries({ queryKey: ["payments-range"] });
      toast.success("Оплата сброшена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      toast.success("Запись удалена");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmDelete = async (id: string) => {
    const ok = await confirmAction({
      title: "Удалить запись?",
      description: "Действие нельзя отменить.",
      destructive: true,
      confirmText: "Удалить",
    });
    if (ok) deleteMut.mutate(id);
  };

  const setStatus = (id: string, status: AppointmentStatus) => {
    statusMut.mutate({ id, status });
  };

  const payFullNow = (id: string, total: number, paid: number) => {
    const due = Math.max(0, total - paid);
    if (due <= 0) {
      toast.info("Уже оплачено полностью");
      return;
    }
    addPayMut.mutate(
      {
        appointment_id: id,
        paid_at: format(new Date(), "yyyy-MM-dd"),
        amount: due,
        note: "Полная оплата",
      },
      { onSuccess: () => toast.success("Оплата записана") },
    );
  };

  const openPayDialog = (id: string, total: number, paid: number) => {
    const due = Math.max(0, total - paid);
    setPayDlg({
      open: true,
      id,
      total,
      paid,
      paid_at: format(new Date(), "yyyy-MM-dd"),
      amount: String(due > 0 ? due : total),
      note: "",
    });
  };

  const submitPayDialog = () => {
    if (!payDlg.id) return;
    const amt = Math.max(0, Math.round(Number(payDlg.amount) || 0));
    if (amt <= 0) {
      toast.error("Введите сумму больше 0");
      return;
    }
    if (!payDlg.paid_at) {
      toast.error("Укажите дату платежа");
      return;
    }
    addPayMut.mutate(
      {
        appointment_id: payDlg.id,
        paid_at: payDlg.paid_at,
        amount: amt,
        note: payDlg.note.trim() || null,
      },
      {
        onSuccess: () => {
          setPayDlg((d) => ({ ...d, open: false }));
          toast.success("Платёж добавлен");
        },
      },
    );
  };




  const grouped = useMemo(() => {
    const filtered = appointments.filter(
      (a) =>
        (mechanicFilter === "all" || a.mechanic_id === mechanicFilter) &&
        (statusFilter === "all" || a.status === statusFilter) &&
        (paymentFilter === "all" || (a.payment_status ?? "unpaid") === paymentFilter),
    );
    const map = new Map<string, typeof filtered>();
    for (const a of filtered) {
      const key = format(startOfDay(parseISO(a.starts_at)), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    const dayDir = sortMode === "day-asc" || sortMode === "time-asc" ? 1 : -1;
    const timeDir = sortMode === "time-asc" ? 1 : sortMode === "time-desc" ? -1 : 1;
    const entries = Array.from(map.entries()).sort(([a], [b]) =>
      dayDir * a.localeCompare(b),
    );
    for (const [, items] of entries) {
      items.sort(
        (x, y) => timeDir * (parseISO(x.starts_at).getTime() - parseISO(y.starts_at).getTime()),
      );
    }
    return entries;
  }, [appointments, mechanicFilter, statusFilter, paymentFilter, sortMode]);

  const changeSort = (v: SortMode) => {
    setSortMode(v);
    if (typeof window !== "undefined") window.localStorage.setItem("schedule.sort", v);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Записи по дням</h1>
        <Button onClick={() => setDialog({ open: true, id: null })}>
          <Plus className="mr-2 h-4 w-4" /> Новая запись
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={mechanicFilter} onValueChange={setMechanicFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все мастера</SelectItem>
            {mechanics.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все оплаты</SelectItem>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortMode} onValueChange={(v) => changeSort(v as SortMode)}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortMode[]).map((k) => (
              <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Нет записей
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([day, items]) => (
          <div key={day}>
            <h2 className="sticky top-0 z-10 -mx-1 mb-2 rounded bg-background/85 px-1 py-1 text-sm font-semibold text-muted-foreground backdrop-blur sm:text-base">
              {format(parseISO(day), "d MMMM yyyy, EEEE", { locale: ru })}
            </h2>
            <div className="space-y-2">
              {items.map((a) => {
                const status = a.status as AppointmentStatus;
                const payment = (a.payment_status ?? "unpaid") as PaymentStatus;
                return (
                  <div
                    key={a.id}
                    className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <span
                      aria-hidden
                      className={`absolute inset-y-0 left-0 w-1 ${STATUS_STRIPE[status]}`}
                    />
                    <div className="grid gap-3 py-3 pl-4 pr-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:py-3.5 sm:pl-5 sm:pr-4">
                      {/* Время + дата */}
                      <button
                        type="button"
                        onClick={() => setDialog({ open: true, id: a.id })}
                        className="flex items-baseline gap-2 text-left sm:w-20 sm:flex-col sm:items-start sm:gap-0.5"
                      >
                        <span className="text-xl font-bold leading-none tabular-nums sm:text-2xl">
                          {format(parseISO(a.starts_at), "HH:mm")}
                        </span>
                        {(() => {
                          const d = parseISO(a.starts_at);
                          const rel = relativeDayLabel(d);
                          return (
                            <span className="flex flex-wrap items-baseline gap-1.5 text-[11px] text-muted-foreground">
                              <span className="tabular-nums">
                                {format(d, "d MMM", { locale: ru })}
                              </span>
                              {rel && (
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                    isToday(d)
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {rel}
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </button>

                      {/* Контент */}
                      <button
                        type="button"
                        onClick={() => setDialog({ open: true, id: a.id })}
                        className="min-w-0 text-left transition group-hover:text-primary"
                      >
                        <div className="truncate font-semibold">
                          {a.car?.brand?.name} {a.car?.model}
                          {a.car?.license_plate ? ` · ${a.car.license_plate}` : ""}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {a.car?.client?.full_name}
                          {a.car?.client?.phone ? ` · ${a.car.client.phone}` : ""}
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {a.services.map((s) => s.service?.name).filter(Boolean).join(", ") ||
                            "—"}
                        </div>
                        {a.mechanic && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: a.mechanic.color }}
                            />
                            <span className="truncate">{a.mechanic.full_name}</span>
                          </div>
                        )}
                      </button>

                      {/* Сумма + действия */}
                      <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex items-baseline justify-between gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                          <div className="text-lg font-bold tabular-nums sm:text-xl">
                            {Number(a.total_price ?? 0).toLocaleString("ru-RU")} ₽
                          </div>
                          {Number(a.paid_amount ?? 0) > 0 &&
                            Number(a.paid_amount) < Number(a.total_price ?? 0) && (
                              <div className="text-[11px] text-muted-foreground tabular-nums">
                                внесено {Number(a.paid_amount).toLocaleString("ru-RU")} ₽
                              </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition hover:opacity-90 ${STATUS_COLORS[status]}`}
                              >
                                {STATUS_LABELS[status]}
                                <ChevronDown className="h-3 w-3 opacity-70" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => setStatus(a.id, s)}
                                  className="gap-2"
                                >
                                  <Check
                                    className={`h-3.5 w-3.5 ${s === status ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {STATUS_LABELS[s]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition hover:opacity-90 ${PAYMENT_COLORS[payment]}`}
                              >
                                {PAYMENT_LABELS[payment]}
                                <ChevronDown className="h-3 w-3 opacity-70" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  payFullNow(a.id, a.total_price ?? 0, a.paid_amount ?? 0)
                                }
                              >
                                Оплачено полностью
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  openPayDialog(a.id, a.total_price ?? 0, a.paid_amount ?? 0)
                                }
                              >
                                Записать платёж…
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  const ok = await confirmAction({
                                    title: "Сбросить оплату?",
                                    description: "Все платежи по этой записи будут удалены.",
                                    destructive: true,
                                    confirmText: "Сбросить",
                                  });
                                  if (ok) clearPayMut.mutate(a.id);
                                }}
                                className="text-destructive"
                              >
                                Сбросить оплату
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <button
                            type="button"
                            title="Печать заказ-наряда"
                            aria-label="Печать заказ-наряда"
                            onClick={() => setPrintApptId(a.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition hover:bg-accent hover:text-foreground"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Удалить запись"
                            aria-label="Удалить запись"
                            onClick={() => confirmDelete(a.id)}
                            disabled={deleteMut.isPending}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-destructive/40 bg-background text-destructive shadow-sm transition hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AppointmentDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        appointmentId={dialog.id}
      />

      <Dialog
        open={payDlg.open}
        onOpenChange={(o) => setPayDlg((d) => ({ ...d, open: o }))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Записать платёж</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Итого: <span className="font-medium text-foreground">{payDlg.total} ₽</span>
              {payDlg.paid > 0 && (
                <> · уже внесено <span className="font-medium text-foreground">{payDlg.paid} ₽</span></>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-date">Дата</Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={payDlg.paid_at}
                  onChange={(e) => setPayDlg((d) => ({ ...d, paid_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount">Сумма, ₽</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={payDlg.amount}
                  onChange={(e) => setPayDlg((d) => ({ ...d, amount: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitPayDialog();
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-note">Заметка (необязательно)</Label>
              <Input
                id="pay-note"
                value={payDlg.note}
                onChange={(e) => setPayDlg((d) => ({ ...d, note: e.target.value }))}
                placeholder="Например: наличными"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDlg((d) => ({ ...d, open: false }))}>
              Отмена
            </Button>
            <Button onClick={submitPayDialog} disabled={addPayMut.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {printApptId && (
        <ApptPrint
          appt={appointments.find((x) => x.id === printApptId) ?? null}
          onDone={() => setPrintApptId(null)}
        />
      )}
    </div>
  );
}

function ApptPrint({
  appt,
  onDone,
}: {
  appt: AppointmentWithRelations | null;
  onDone: () => void;
}) {
  if (!appt) {
    onDone();
    return null;
  }
  const car = appt.car;
  const client = car?.client;
  const brand = car?.brand?.name ?? "";
  const status = (appt.status ?? "planned") as keyof typeof STATUS_LABELS;
  const payment = (appt.payment_status ?? "unpaid") as keyof typeof PAYMENT_LABELS;
  const total = appt.total_price ?? 0;
  const paid = appt.paid_amount ?? 0;
  const due = Math.max(0, total - paid);

  const carSection: PrintKV[] = [
    { label: "Марка / модель", value: `${brand} ${car?.model ?? ""}`.trim() },
    { label: "Год выпуска", value: car?.year ? String(car.year) : "" },
    { label: "Госномер", value: car?.license_plate ?? "" },
    { label: "VIN", value: car?.vin ?? "" },
    { label: "Двигатель", value: [car?.engine_volume ? `${car.engine_volume} л` : "", car?.engine_power ? `${car.engine_power} л.с.` : ""].filter(Boolean).join(" · ") },
    { label: "Кузов / КПП / привод", value: [car?.color ?? "", car?.transmission ?? "", car?.drive_type ?? ""].filter(Boolean).join(" · ") },
    { label: "Пробег", value: car?.mileage ? `${car.mileage} км` : "" },
  ];

  const clientSection: PrintKV[] = [
    { label: "ФИО", value: client?.full_name ?? "" },
    { label: "Телефон", value: client?.phone ?? "" },
  ];

  const works = appt.services.map((s) => ({
    name: s.service?.name ?? "Услуга",
    price: s.price ?? 0,
  }));

  const startsAt = new Date(appt.starts_at);
  const dateStr = format(startsAt, "d MMMM yyyy, HH:mm", { locale: ru });

  return (
    <PrintDocument
      onDone={onDone}
      title={`Заказ-наряд № ${appt.id.slice(0, 8).toUpperCase()}`}
      meta={[
        { label: "Дата и время", value: dateStr },
        { label: "Мастер", value: appt.mechanic?.full_name ?? "—" },
        { label: "Статус", value: STATUS_LABELS[status] },
        { label: "Оплата", value: PAYMENT_LABELS[payment] },
      ]}
      sections={[
        { title: "Клиент", rows: clientSection },
        { title: "Автомобиль", rows: carSection },
      ]}
      works={works}
      total={total}
      footer={[
        { label: "Внесено", value: new Intl.NumberFormat("ru-RU").format(paid) + " ₽" },
        { label: "К доплате", value: new Intl.NumberFormat("ru-RU").format(due) + " ₽" },
      ]}
      signatures
    />
  );
}
