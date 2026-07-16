import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { listAppointments, listMechanics, updateAppointment, getAppointment } from "@/lib/api";
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
    } | null;
  }>({ open: false, id: null, start: null, prefill: null });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });

  const events = useMemo(
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
          resource: { color: mech?.color ?? "#64748b", status: a.status },
        };
      }),
    [appointments, mechanics],
  );

  const hasPrefill = !!(search.services || search.brand || search.model);
  const currentPrefill = hasPrefill
    ? {
        services: parseServices(search.services),
        brand: search.brand,
        model: search.model,
      }
    : null;

  const openNew = (start: Date) => {
    setDialog({ open: true, id: null, start, prefill: currentPrefill });
    if (hasPrefill) navigate({ search: {}, replace: true });
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
    onMutate: () => {
      // optimistic: nothing (we refetch on success)
    },
    onSuccess: () => {
      toast.success("Запись перемещена");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onEventDrop: withDragAndDropProps["onEventDrop"] = ({ event, start, end }) => {
    const id = (event as { id: string }).id;
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    moveMutation.mutate({ id, start: s, end: e });
  };

  const onEventResize: withDragAndDropProps["onEventResize"] = ({ event, start, end }) => {
    const id = (event as { id: string }).id;
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    moveMutation.mutate({ id, start: s, end: e });
  };



  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Календарь записей</h1>
          <p className="text-sm text-muted-foreground">
            {appointments.length} записей · клик по свободному слоту создаёт новую
          </p>
          {hasPrefill && (
            <p className="mt-1 text-sm text-red-600">
              Данные из калькулятора готовы — выберите свободный слот на календаре
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => openNew(new Date())}>
            <Plus className="mr-2 h-4 w-4" /> Новая запись
          </Button>
        </div>

      </div>


      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {mechanics.map((m) => (
          <div key={m.id} className="flex items-center gap-1">
            <span className="h-3 w-3 rounded" style={{ background: m.color }} />
            <span>{m.full_name}</span>
          </div>
        ))}
      </div>

      <div className="mb-3 text-xs text-muted-foreground">
        Записи можно перетаскивать между слотами и растягивать за нижний край
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
          onSelectSlot={(slot) => openNew(slot.start as Date)}
          onSelectEvent={(ev) => {
            const e = ev as { id: string };
            setDialog({ open: true, id: e.id, start: null, prefill: null });
          }}
          eventPropGetter={(ev) => {
            const e = ev as { resource?: { color?: string; status?: string } };
            return {
              style: {
                backgroundColor: e.resource?.color ?? "#64748b",
                border: "none",
                opacity: e.resource?.status === "cancelled" ? 0.4 : 1,
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
            const e = ev as { title: string; resource?: { status?: string } };
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
      />
    </div>
  );
}
