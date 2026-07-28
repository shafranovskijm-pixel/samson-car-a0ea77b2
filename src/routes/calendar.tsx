import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar as BigCalendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import withDragAndDropDefault, {
  type withDragAndDropProps,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "@/styles/calendar.css";

import { Button } from "@/components/ui/button";
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
  updateAppointment,
  getAppointment,
  listAllMechanicShifts,
  createMechanicShift,
  updateMechanicShift,
  deleteMechanicShift,
} from "@/lib/api";
import { STATUS_LABELS } from "@/lib/types";
import { AppointmentDialog } from "@/components/AppointmentDialog";

const locales = { ru };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: "Весь день",
  previous: "Назад",
  next: "Вперёд",
  today: "Сегодня",
  month: "Месяц",
  week: "Неделя",
  day: "День",
  agenda: "Список",
  date: "Дата",
  time: "Время",
  event: "Запись",
  noEventsInRange: "Нет записей",
  showMore: (n: number) => `+ ещё ${n}`,
};

const searchSchema = z.object({
  services: fallback(z.string(), "").default(""),
  brand: fallback(z.string(), "").default(""),
  model: fallback(z.string(), "").default(""),
  carId: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/calendar")({
  ssr: false,
  validateSearch: zodValidator(searchSchema),
  component: CalendarPage,
});

const withDragAndDrop = (withDragAndDropDefault as unknown as { default?: typeof withDragAndDropDefault }).default ?? withDragAndDropDefault;
const DnDCalendar = withDragAndDrop(BigCalendar as never) as unknown as React.ComponentType<
  React.ComponentProps<typeof BigCalendar> & withDragAndDropProps
>;

function parseServices(s: string): { service_id: string; price: number }[] {
  if (!s) return [];
  return s
    .split(",")
    .map((p) => p.split(":"))
    .filter((a) => a.length === 2 && a[0])
    .map(([id, price]) => ({ service_id: id, price: Number(price) || 0 }));
}

function CalendarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/calendar" });
  const [mode, setMode] = useState<"appointments" | "shifts">("appointments");
  const [view, setView] = useState<View>(
    typeof window !== "undefined" && window.innerWidth < 640 ? Views.DAY : Views.WEEK,
  );
  const [date, setDate] = useState(new Date());
  const [dialog, setDialog] = useState<{
    open: boolean;
    id: string | null;
    start: Date | null;
    prefill: {
      services: { service_id: string; price: number }[];
      brand: string;
      model: string;
      carId: string;
    } | null;
  }>({ open: false, id: null, start: null, prefill: null });

  const [shiftDlg, setShiftDlg] = useState<{
    open: boolean;
    id: string | null;
    mechanic_id: string;
    start: Date | null;
    end: Date | null;
    note: string;
  }>({ open: false, id: null, mechanic_id: "", start: null, end: null, note: "" });
  const [activeMechanicId, setActiveMechanicId] = useState<string>("");

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });
  const { data: shifts = [] } = useQuery({
    queryKey: ["mechanic-shifts", "all"],
    queryFn: listAllMechanicShifts,
    enabled: mode === "shifts",
  });

  const appointmentEvents = useMemo(
    () =>
      appointments.map((a) => {
        const start = new Date(a.starts_at);
        const end = new Date(start.getTime() + a.duration_minutes * 60000);
        const car = a.car;
        const title = `${car?.brand?.name ?? ""} ${car?.model ?? ""} · ${car?.client?.full_name ?? ""}`.trim();
        const mech = mechanics.find((m) => m.id === a.mechanic_id);
        return {
          id: a.id,
          title,
          start,
          end,
          resource: { kind: "appt" as const, color: mech?.color ?? "#64748b", status: a.status },
        };
      }),
    [appointments, mechanics],
  );

  const shiftEvents = useMemo(
    () =>
      shifts.map((s) => {
        const mech = mechanics.find((m) => m.id === s.mechanic_id);
        return {
          id: s.id,
          title: `${mech?.full_name ?? "Мастер"}${s.note ? " · " + s.note : ""}`,
          start: new Date(s.starts_at),
          end: new Date(s.ends_at),
          resource: {
            kind: "shift" as const,
            color: mech?.color ?? "#64748b",
            mechanic_id: s.mechanic_id,
            note: s.note ?? "",
          },
        };
      }),
    [shifts, mechanics],
  );

  const events = mode === "appointments" ? appointmentEvents : shiftEvents;

  const hasPrefill = !!(search.services || search.brand || search.model || search.carId);
  const currentPrefill = hasPrefill
    ? {
        services: parseServices(search.services),
        brand: search.brand,
        model: search.model,
        carId: search.carId,
      }
    : null;

  const openNew = (start: Date) => {
    setDialog({ open: true, id: null, start, prefill: currentPrefill });
  };

  // Clear prefill from URL after the dialog is open, so navigation
  // doesn't race with the dialog opening in the same tick.
  useEffect(() => {
    if (dialog.open && hasPrefill) {
      navigate({ search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog.open]);

  const openNewShift = (start: Date, end: Date) => {
    setShiftDlg({
      open: true,
      id: null,
      mechanic_id: mechanics[0]?.id ?? "",
      start,
      end,
      note: "",
    });
  };

  const now = useMemo(() => new Date(), []);

  const qc = useQueryClient();
  const moveMutation = useMutation({
    mutationFn: async (args: { id: string; start: Date; end: Date }) => {
      const appt = await getAppointment(args.id);
      const durationMs = args.end.getTime() - args.start.getTime();
      const duration_minutes = Math.max(15, Math.round(durationMs / 60000));
      await updateAppointment(args.id, {
        car_id: appt.car_id,
        mechanic_id: appt.mechanic_id,
        starts_at: args.start.toISOString(),
        duration_minutes,
        status: appt.status,
        mileage: appt.mileage,
        comment: appt.comment,
        services: appt.services.map((s) => ({
          service_id: s.service_id,
          price: s.price,
          mechanic_payout: s.mechanic_payout ?? 0,
        })),
      });
    },
    onSuccess: () => {
      toast.success("Запись перемещена");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invalidateShifts = () => {
    qc.invalidateQueries({ queryKey: ["mechanic-shifts", "all"] });
    qc.invalidateQueries({ queryKey: ["mechanic-shifts"] });
  };

  const createShiftMut = useMutation({
    mutationFn: createMechanicShift,
    onSuccess: () => {
      toast.success("Смена добавлена");
      invalidateShifts();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateShiftMut = useMutation({
    mutationFn: (v: { id: string; starts_at?: string; ends_at?: string; note?: string | null }) =>
      updateMechanicShift(v.id, {
        starts_at: v.starts_at,
        ends_at: v.ends_at,
        note: v.note,
      }),
    onSuccess: () => {
      toast.success("Смена обновлена");
      invalidateShifts();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteShiftMut = useMutation({
    mutationFn: deleteMechanicShift,
    onSuccess: () => {
      toast.success("Смена удалена");
      invalidateShifts();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onEventDrop: withDragAndDropProps["onEventDrop"] = ({ event, start, end }) => {
    const e = event as { id: string; resource?: { kind?: string } };
    const s = start instanceof Date ? start : new Date(start);
    const en = end instanceof Date ? end : new Date(end);
    if (e.resource?.kind === "shift") {
      updateShiftMut.mutate({ id: e.id, starts_at: s.toISOString(), ends_at: en.toISOString() });
    } else {
      moveMutation.mutate({ id: e.id, start: s, end: en });
    }
  };

  const onEventResize: withDragAndDropProps["onEventResize"] = ({ event, start, end }) => {
    const e = event as { id: string; resource?: { kind?: string } };
    const s = start instanceof Date ? start : new Date(start);
    const en = end instanceof Date ? end : new Date(end);
    if (e.resource?.kind === "shift") {
      updateShiftMut.mutate({ id: e.id, starts_at: s.toISOString(), ends_at: en.toISOString() });
    } else {
      moveMutation.mutate({ id: e.id, start: s, end: en });
    }
  };

  const submitShift = () => {
    if (!shiftDlg.mechanic_id || !shiftDlg.start || !shiftDlg.end) {
      toast.error("Выберите мастера и время");
      return;
    }
    if (shiftDlg.end.getTime() <= shiftDlg.start.getTime()) {
      toast.error("Конец смены должен быть позже начала");
      return;
    }
    const payload = {
      starts_at: shiftDlg.start.toISOString(),
      ends_at: shiftDlg.end.toISOString(),
      note: shiftDlg.note.trim() || null,
    };
    if (shiftDlg.id) {
      updateShiftMut.mutate(
        { id: shiftDlg.id, ...payload },
        { onSuccess: () => setShiftDlg((d) => ({ ...d, open: false })) },
      );
    } else {
      createShiftMut.mutate(
        { mechanic_id: shiftDlg.mechanic_id, ...payload },
        { onSuccess: () => setShiftDlg((d) => ({ ...d, open: false })) },
      );
    }
  };

  const toLocalInput = (d: Date | null) => {
    if (!d) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setMode("appointments")}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              mode === "appointments" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Записи
          </button>
          <button
            type="button"
            onClick={() => setMode("shifts")}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              mode === "shifts" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Сотрудники
          </button>
        </div>
        {mode === "appointments" ? (
          <Button onClick={() => openNew(new Date())}>
            <Plus className="mr-2 h-4 w-4" /> Новая запись
          </Button>
        ) : (
          <Button
            onClick={() => {
              const s = new Date();
              s.setMinutes(0, 0, 0);
              const e = new Date(s.getTime() + 8 * 60 * 60 * 1000);
              openNewShift(s, e);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Новая смена
          </Button>
        )}
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">
          {mode === "appointments" ? "Календарь записей" : "График сотрудников"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "appointments"
            ? `${appointments.length} записей · клик по свободному слоту создаёт новую`
            : activeMechanicId
              ? "Выбран мастер — клик по дню/неделе/слоту сразу закрашивает смену его цветом"
              : "Выберите мастера ниже, чтобы отмечать смены кликом, или добавьте через «Новая смена»"}
        </p>
        {hasPrefill && mode === "appointments" && (
          <p className="mt-1 text-sm text-red-600">
            Данные из калькулятора готовы — выберите свободный слот на календаре
          </p>
        )}
      </div>

      {mode === "shifts" ? (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveMechanicId("")}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              activeMechanicId === ""
                ? "border-foreground bg-foreground text-background"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Никто
          </button>
          {mechanics.map((m) => {
            const active = activeMechanicId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMechanicId(m.id)}
                className="rounded-full border px-2.5 py-1 text-xs font-medium transition"
                style={
                  active
                    ? { background: m.color, borderColor: m.color, color: "#fff" }
                    : { borderColor: m.color, color: m.color }
                }
              >
                <span
                  className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ background: m.color }}
                />
                {m.full_name}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {mechanics.map((m) => (
            <div key={m.id} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded" style={{ background: m.color }} />
              <span>{m.full_name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 text-xs text-muted-foreground">
        {mode === "appointments"
          ? "Записи можно перетаскивать между слотами и растягивать за нижний край"
          : "Смены можно перетаскивать и растягивать; клик по смене — редактировать"}
      </div>


      <div className="rounded-lg border bg-card" style={{ height: "calc(100dvh - 220px)" }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          culture="ru"
          messages={messages}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          selectable
          resizable
          draggableAccessor={() => true}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          getNow={() => new Date()}
          scrollToTime={now}
          min={new Date(1970, 0, 1, 9, 0, 0)}
          max={new Date(1970, 0, 1, 22, 0, 0)}
          onSelectSlot={(slot) => {
            const s = slot.start as Date;
            const e = slot.end as Date;
            if (mode === "shifts") {
              if (activeMechanicId) {
                // Month view returns midnight-to-midnight range; treat that
                // as a working-day 9-18 default so it isn't a 24h block.
                const sameMidnight =
                  s.getHours() === 0 && s.getMinutes() === 0 &&
                  e.getHours() === 0 && e.getMinutes() === 0;
                let start = s;
                let end = e;
                if (sameMidnight) {
                  const days = Math.max(
                    1,
                    Math.round((e.getTime() - s.getTime()) / 86_400_000),
                  );
                  start = new Date(s);
                  start.setHours(9, 0, 0, 0);
                  end = new Date(s);
                  end.setDate(end.getDate() + (days - 1));
                  end.setHours(18, 0, 0, 0);
                }
                createShiftMut.mutate({
                  mechanic_id: activeMechanicId,
                  starts_at: start.toISOString(),
                  ends_at: end.toISOString(),
                  note: null,
                });
              } else {
                openNewShift(s, e);
              }
            } else {
              openNew(s);
            }
          }}
          onSelectEvent={(ev) => {
            const e = ev as {
              id: string;
              start: Date;
              end: Date;
              resource?: { kind?: string; mechanic_id?: string; note?: string };
            };
            if (e.resource?.kind === "shift") {
              setShiftDlg({
                open: true,
                id: e.id,
                mechanic_id: e.resource.mechanic_id ?? "",
                start: e.start,
                end: e.end,
                note: e.resource.note ?? "",
              });
            } else {
              setDialog({ open: true, id: e.id, start: null, prefill: null });
            }
          }}
          eventPropGetter={(ev) => {
            const e = ev as { resource?: { color?: string; status?: string; kind?: string } };
            return {
              style: {
                backgroundColor: e.resource?.color ?? "#64748b",
                border: "none",
                opacity:
                  e.resource?.kind === "shift"
                    ? 0.75
                    : e.resource?.status === "cancelled"
                      ? 0.4
                      : 1,
              },
            };
          }}
          slotPropGetter={(slotDate) =>
            slotDate.getTime() < now.getTime() - 60_000
              ? { style: { backgroundColor: "rgba(0,0,0,0.04)" } }
              : {}
          }
          dayPropGetter={(day) => {
            const today = new Date();
            const isPast =
              day.getTime() <
              new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            return isPast ? { style: { backgroundColor: "rgba(0,0,0,0.03)" } } : {};
          }}
          tooltipAccessor={(ev) => {
            const e = ev as { title: string; resource?: { status?: string; kind?: string } };
            if (e.resource?.kind === "shift") return e.title;
            return `${e.title} · ${STATUS_LABELS[e.resource?.status as keyof typeof STATUS_LABELS] ?? ""}`;
          }}
        />
      </div>

      <AppointmentDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        appointmentId={dialog.id}
        defaultStart={dialog.start}
        defaultServices={dialog.prefill?.services}
        defaultBrandId={dialog.prefill?.brand}
        defaultModelId={dialog.prefill?.model}
        defaultCarId={dialog.prefill?.carId || null}
      />

      <Dialog
        open={shiftDlg.open}
        onOpenChange={(o) => setShiftDlg((d) => ({ ...d, open: o }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{shiftDlg.id ? "Смена" : "Новая смена"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Мастер</Label>
              <Select
                value={shiftDlg.mechanic_id}
                onValueChange={(v) => setShiftDlg((d) => ({ ...d, mechanic_id: v }))}
                disabled={!!shiftDlg.id}
              >
                <SelectTrigger><SelectValue placeholder="Выберите мастера" /></SelectTrigger>
                <SelectContent>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                        {m.full_name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="shift-start">Начало</Label>
                <Input
                  id="shift-start"
                  type="datetime-local"
                  value={toLocalInput(shiftDlg.start)}
                  onChange={(e) =>
                    setShiftDlg((d) => ({
                      ...d,
                      start: e.target.value ? new Date(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-end">Конец</Label>
                <Input
                  id="shift-end"
                  type="datetime-local"
                  value={toLocalInput(shiftDlg.end)}
                  onChange={(e) =>
                    setShiftDlg((d) => ({
                      ...d,
                      end: e.target.value ? new Date(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-note">Заметка</Label>
              <Input
                id="shift-note"
                value={shiftDlg.note}
                onChange={(e) => setShiftDlg((d) => ({ ...d, note: e.target.value }))}
                placeholder="Например: подмена, дежурство"
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <div>
              {shiftDlg.id && (
                <Button
                  variant="destructive"
                  onClick={() =>
                    deleteShiftMut.mutate(shiftDlg.id!, {
                      onSuccess: () => setShiftDlg((d) => ({ ...d, open: false })),
                    })
                  }
                >
                  Удалить
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShiftDlg((d) => ({ ...d, open: false }))}
              >
                Отмена
              </Button>
              <Button
                onClick={submitShift}
                disabled={createShiftMut.isPending || updateShiftMut.isPending}
              >
                Сохранить
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
