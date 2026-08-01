// Единые правила периодов для всей бухгалтерии.
// Все периоды — КАЛЕНДАРНЫЕ (день / неделя с понедельника / календарный месяц),
// плюс «всё время» и произвольный период.
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  format,
} from "date-fns";
import { ru } from "date-fns/locale";

export type PeriodKey = "day" | "week" | "month" | "all" | "custom";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
  all: "Всё время",
  custom: "Период",
};

// Границы «всего времени» — заведомо шире любых данных мастерской.
export const ALL_TIME_START = new Date(2000, 0, 1, 0, 0, 0, 0);
export const ALL_TIME_END = new Date(2100, 0, 1, 23, 59, 59, 999);

export const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

export function parseIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface CustomRange {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
}

export function defaultCustomRange(anchor: Date = new Date()): CustomRange {
  return { from: isoDate(startOfMonth(anchor)), to: isoDate(endOfMonth(anchor)) };
}

/** Границы периода. Всегда [start 00:00:00.000 .. end 23:59:59.999]. */
export function periodRange(
  period: PeriodKey,
  anchor: Date,
  custom?: CustomRange,
): { start: Date; end: Date } {
  if (period === "all") return { start: ALL_TIME_START, end: ALL_TIME_END };
  if (period === "custom") {
    const f = custom ? parseIsoDate(custom.from) : null;
    const t = custom ? parseIsoDate(custom.to) : null;
    const start = startOfDay(f ?? startOfMonth(anchor));
    const end = endOfDay(t ?? endOfMonth(anchor));
    // Защита от перевёрнутого диапазона: считаем по одному дню start.
    if (end.getTime() < start.getTime()) return { start, end: endOfDay(start) };
    return { start, end };
  }
  if (period === "day") return { start: startOfDay(anchor), end: endOfDay(anchor) };
  if (period === "week")
    return {
      start: startOfWeek(anchor, { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

export function canNavigate(period: PeriodKey) {
  return period === "day" || period === "week" || period === "month";
}

export function stepAnchor(period: PeriodKey, anchor: Date, dir: 1 | -1): Date {
  if (period === "day") return addDays(anchor, dir);
  if (period === "week") return addWeeks(anchor, dir);
  if (period === "month") return addMonths(anchor, dir);
  return anchor;
}

export function periodRangeLabel(
  period: PeriodKey,
  anchor: Date,
  custom?: CustomRange,
): string {
  if (period === "all") return "Всё время";
  const { start, end } = periodRange(period, anchor, custom);
  if (period === "day") return format(start, "d MMMM yyyy", { locale: ru });
  if (period === "month") return format(start, "LLLL yyyy", { locale: ru });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return `${format(start, sameMonth ? "d" : "d MMM", { locale: ru })} – ${format(end, "d MMM yyyy", { locale: ru })}`;
}

/** Короткая подпись «за …» для текстов. */
export function periodNoun(period: PeriodKey): string {
  if (period === "day") return "день";
  if (period === "week") return "неделю";
  if (period === "month") return "месяц";
  if (period === "all") return "всё время";
  return "период";
}

export function isCurrentPeriod(period: PeriodKey, anchor: Date): boolean {
  const now = new Date();
  if (period === "day") return isSameDay(anchor, now);
  if (period === "week")
    return isSameDay(startOfWeek(anchor, { weekStartsOn: 1 }), startOfWeek(now, { weekStartsOn: 1 }));
  if (period === "month")
    return anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth();
  return true;
}

/** Попадает ли инстант в период (включительно). */
export function inRange(d: Date | string | number, start: Date, end: Date): boolean {
  const t = typeof d === "object" ? d.getTime() : new Date(d).getTime();
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t <= end.getTime();
}

/** Попадает ли календарная дата (yyyy-MM-dd, напр. дата аванса/расхода) в период. */
export function inDayRange(day: string | Date, start: Date, end: Date): boolean {
  const s = typeof day === "string" ? day.slice(0, 10) : isoDate(day);
  return s >= isoDate(start) && s <= isoDate(end);
}
