import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, ChevronDown, Plus, Printer } from "lucide-react";

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
  updateAppointmentPayment,
  updateAppointmentStatus,
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
import type { AppointmentWithRelations } from "@/lib/api";

export const Route = createFileRoute("/schedule")({
  ssr: false,
  component: SchedulePage,
});

function SchedulePage() {
  const qc = useQueryClient();
  const [mechanicFilter, setMechanicFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
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

  const [prepaidDlg, setPrepaidDlg] = useState<{
    open: boolean;
    id: string | null;
    total: number;
    amount: string;
  }>({ open: false, id: null, total: 0, amount: "" });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const paymentMut = useMutation({
    mutationFn: (v: { id: string; payment_status: PaymentStatus; paid_amount: number }) =>
      updateAppointmentPayment(v.id, {
        payment_status: v.payment_status,
        paid_amount: v.paid_amount,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = (id: string, status: AppointmentStatus) => {
    statusMut.mutate({ id, status });
  };

  const setPayment = (
    id: string,
    next: PaymentStatus,
    total: number,
    paid: number,
  ) => {
    if (next === "prepaid") {
      setPrepaidDlg({
        open: true,
        id,
        total,
        amount: String(paid > 0 && paid < total ? paid : Math.round(total / 2)),
      });
      return;
    }
    const paid_amount = next === "paid" ? total : 0;
    paymentMut.mutate({ id, payment_status: next, paid_amount });
  };

  const submitPrepaid = () => {
    if (!prepaidDlg.id) return;
    const amt = Math.max(0, Math.round(Number(prepaidDlg.amount) || 0));
    if (amt <= 0) {
      toast.error("Введите сумму больше 0");
      return;
    }
    if (amt >= prepaidDlg.total) {
      toast.error("Сумма предоплаты должна быть меньше итоговой");
      return;
    }
    paymentMut.mutate(
      { id: prepaidDlg.id, payment_status: "prepaid", paid_amount: amt },
      { onSuccess: () => setPrepaidDlg((d) => ({ ...d, open: false })) },
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
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appointments, mechanicFilter, statusFilter, paymentFilter]);

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
      </div>

      {grouped.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Нет записей
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([day, items]) => (
          <div key={day}>
            <h2 className="mb-2 text-lg font-semibold">
              {format(parseISO(day), "d MMMM yyyy, EEEE", { locale: ru })}
            </h2>
            <div className="space-y-2">
              {items.map((a) => {
                const status = a.status as AppointmentStatus;
                const payment = (a.payment_status ?? "unpaid") as PaymentStatus;
                return (
                  <div
                    key={a.id}
                    className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
                  >
                    <button
                      type="button"
                      onClick={() => setDialog({ open: true, id: a.id })}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <div className="w-16 shrink-0 text-sm font-medium tabular-nums">
                        {format(parseISO(a.starts_at), "HH:mm")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {a.car?.brand?.name} {a.car?.model}
                          {a.car?.license_plate ? ` · ${a.car.license_plate}` : ""}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {a.car?.client?.full_name}
                          {a.car?.client?.phone ? ` · ${a.car.client.phone}` : ""}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {a.services.map((s) => s.service?.name).filter(Boolean).join(", ") || "—"}
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                      {a.mechanic && (
                        <div className="flex items-center gap-1 text-xs sm:justify-end">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: a.mechanic.color }}
                          />
                          {a.mechanic.full_name}
                        </div>
                      )}
                      <div className="text-sm font-semibold sm:text-right">
                        {a.total_price} ₽
                        {payment === "prepaid" && a.paid_amount > 0 && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            (внесено {a.paid_amount})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        <button
                          type="button"
                          title="Печать заказ-наряда"
                          onClick={() => setPrintApptId(a.id)}
                          className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium shadow-sm transition hover:bg-accent"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Печать
                        </button>
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
                            {(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((p) => (
                              <DropdownMenuItem
                                key={p}
                                onClick={() =>
                                  setPayment(a.id, p, a.total_price ?? 0, a.paid_amount ?? 0)
                                }
                                className="gap-2"
                              >
                                <Check
                                  className={`h-3.5 w-3.5 ${p === payment ? "opacity-100" : "opacity-0"}`}
                                />
                                {PAYMENT_LABELS[p]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        open={prepaidDlg.open}
        onOpenChange={(o) => setPrepaidDlg((d) => ({ ...d, open: o }))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Предоплата</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Итого по записи: <span className="font-medium text-foreground">{prepaidDlg.total} ₽</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prepaid-amount">Сколько внесли, ₽</Label>
              <Input
                id="prepaid-amount"
                type="number"
                inputMode="numeric"
                min={0}
                max={prepaidDlg.total}
                value={prepaidDlg.amount}
                onChange={(e) => setPrepaidDlg((d) => ({ ...d, amount: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitPrepaid();
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPrepaidDlg((d) => ({ ...d, open: false }))}
            >
              Отмена
            </Button>
            <Button onClick={submitPrepaid} disabled={paymentMut.isPending}>
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
