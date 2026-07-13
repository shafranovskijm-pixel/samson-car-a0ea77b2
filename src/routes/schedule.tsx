import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { listAppointments, listMechanics } from "@/lib/api";
import { STATUS_COLORS, STATUS_LABELS, type AppointmentStatus } from "@/lib/types";
import { AppointmentDialog } from "@/components/AppointmentDialog";

export const Route = createFileRoute("/schedule")({
  ssr: false,
  component: SchedulePage,
});

function SchedulePage() {
  const [mechanicFilter, setMechanicFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });

  const grouped = useMemo(() => {
    const filtered = appointments.filter(
      (a) =>
        (mechanicFilter === "all" || a.mechanic_id === mechanicFilter) &&
        (statusFilter === "all" || a.status === statusFilter),
    );
    const map = new Map<string, typeof filtered>();
    for (const a of filtered) {
      const key = format(startOfDay(parseISO(a.starts_at)), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appointments, mechanicFilter, statusFilter]);

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
              {items.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setDialog({ open: true, id: a.id })}
                  className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary/50"
                >
                  <div className="w-16 text-sm font-medium tabular-nums">
                    {format(parseISO(a.starts_at), "HH:mm")}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {a.car?.brand?.name} {a.car?.model}
                      {a.car?.license_plate ? ` · ${a.car.license_plate}` : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {a.car?.client?.full_name}
                      {a.car?.client?.phone ? ` · ${a.car.client.phone}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {a.services.map((s) => s.service?.name).filter(Boolean).join(", ") || "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    {a.mechanic && (
                      <div className="flex items-center justify-end gap-1 text-xs">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: a.mechanic.color }}
                        />
                        {a.mechanic.full_name}
                      </div>
                    )}
                    <div className="mt-1 text-sm font-semibold">{a.total_price} ₽</div>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${STATUS_COLORS[a.status as AppointmentStatus]}`}
                    >
                      {STATUS_LABELS[a.status as AppointmentStatus]}
                    </Badge>
                  </div>
                </button>
              ))}
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
