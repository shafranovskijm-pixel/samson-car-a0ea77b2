import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  PAYMENT_CYCLE,
  PAYMENT_LABELS,
  STATUS_COLORS,
  STATUS_CYCLE,
  STATUS_LABELS,
  type AppointmentStatus,
  type PaymentStatus,
} from "@/lib/types";
import { AppointmentDialog } from "@/components/AppointmentDialog";

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

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });

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

  const cycleStatus = (id: string, current: AppointmentStatus) => {
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    statusMut.mutate({ id, status: next });
  };

  const cyclePayment = (
    id: string,
    current: PaymentStatus,
    total: number,
    paid: number,
  ) => {
    const idx = PAYMENT_CYCLE.indexOf(current);
    const next = PAYMENT_CYCLE[(idx + 1) % PAYMENT_CYCLE.length];
    let paid_amount = paid;
    if (next === "paid") paid_amount = total;
    else if (next === "unpaid") paid_amount = 0;
    else if (next === "prepaid" && (paid <= 0 || paid >= total))
      paid_amount = Math.round(total / 2);
    paymentMut.mutate({ id, payment_status: next, paid_amount });
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
                          title="Переключить статус работы"
                          onClick={() => cycleStatus(a.id, status)}
                          className={`rounded-md border px-2 py-1 text-xs transition hover:opacity-80 ${STATUS_COLORS[status]}`}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                        <button
                          type="button"
                          title="Переключить статус оплаты"
                          onClick={() =>
                            cyclePayment(a.id, payment, a.total_price ?? 0, a.paid_amount ?? 0)
                          }
                          className={`rounded-md border px-2 py-1 text-xs transition hover:opacity-80 ${PAYMENT_COLORS[payment]}`}
                        >
                          {PAYMENT_LABELS[payment]}
                        </button>
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
    </div>
  );
}

// Keep Badge import used to avoid tree-shake warnings; used elsewhere if needed.
void Badge;
