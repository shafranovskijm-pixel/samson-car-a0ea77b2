import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as BigCalendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";

import { Button } from "@/components/ui/button";
import { listAppointments, listMechanics } from "@/lib/api";
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

export const Route = createFileRoute("/calendar")({
  ssr: false,
  component: CalendarPage,
});

function CalendarPage() {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [dialog, setDialog] = useState<{ open: boolean; id: string | null; start: Date | null }>(
    { open: false, id: null, start: null },
  );

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

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Календарь записей</h1>
          <p className="text-sm text-muted-foreground">
            {appointments.length} записей · клик по слоту создаёт новую
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, id: null, start: new Date() })}>
          <Plus className="mr-2 h-4 w-4" /> Новая запись
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {mechanics.map((m) => (
          <div key={m.id} className="flex items-center gap-1">
            <span className="h-3 w-3 rounded" style={{ background: m.color }} />
            <span>{m.full_name}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card" style={{ height: "calc(100vh - 220px)" }}>
        <BigCalendar
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
          onSelectSlot={(slot) =>
            setDialog({ open: true, id: null, start: slot.start as Date })
          }
          onSelectEvent={(ev) => setDialog({ open: true, id: ev.id as string, start: null })}
          eventPropGetter={(ev) => ({
            style: {
              backgroundColor: ev.resource?.color ?? "#64748b",
              border: "none",
              opacity: ev.resource?.status === "cancelled" ? 0.4 : 1,
            },
          })}
          tooltipAccessor={(ev) =>
            `${ev.title} · ${STATUS_LABELS[ev.resource?.status as keyof typeof STATUS_LABELS] ?? ""}`
          }
        />
      </div>

      <AppointmentDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        appointmentId={dialog.id}
        defaultStart={dialog.start}
      />
    </div>
  );
}
