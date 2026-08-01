// Единые правила периодов для всей бухгалтерии.
// Все периоды — КАЛЕНДАРНЫЕ (день / неделя с понедельника / календарный месяц),
// плюс «всё время» и произвольный период.
// ВАЖНО: все границы считаются в часовом поясе Уссурийска (UTC+10),
// независимо от настроек времени на компьютере пользователя.
import { ussDateISO, ussLocalToInstant } from "./tz";

export type PeriodKey = "day" | "week" | "month" | "all" | "custom";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
  all: "Всё время",
  custom: "Период",
};

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTHS_NOM = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

// ---------- работа с календарной датой как строкой yyyy-MM-dd ----------

const isoToUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const utcToIso = (d: Date) => d.toISOString().slice(0, 10);

/** Календарная дата (Уссурийск) для инстанта. */
export const isoDate = (d: Date) => ussDateISO(d);

/** «Сегодня» в Уссурийске. */
export const todayIso = () => ussDateISO(new Date());

/** Начало календарного дня Уссурийска как инстант. */
export const dayStart = (iso: string) => ussLocalToInstant(iso, "00:00");
/** Конец календарного дня Уссурийска (23:59:59.999) как инстант. */
export const dayEnd = (iso: string) =>
  new Date(ussLocalToInstant(iso, "23:59").getTime() + 59_999);

const addDaysIso = (iso: string, n: number) =>
  utcToIso(new Date(isoToUtc(iso).getTime() + n * 86_400_000));

const startOfMonthIso = (iso: string) => `${iso.slice(0, 7)}-01`;
const endOfMonthIso = (iso: string) => {
  const d = isoToUtc(iso);
  return utcToIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
};
const startOfWeekIso = (iso: string) => {
  const dow = isoToUtc(iso).getUTCDay(); // 0 = вс
  return addDaysIso(iso, dow === 0 ? -6 : 1 - dow);
};
const addMonthsIso = (iso: string, n: number) => {
  const d = isoToUtc(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const day = Math.min(d.getUTCDate(), lastDay);
  return utcToIso(new Date(Date.UTC(y, m, day)));
};

// Границы «всего времени» — заведомо шире любых данных мастерской.
export const ALL_TIME_START = dayStart("2000-01-01");
export const ALL_TIME_END = dayEnd("2100-01-01");

export function parseIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = dayStart(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface CustomRange {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
}

export function defaultCustomRange(anchor: Date = new Date()): CustomRange {
  const iso = isoDate(anchor);
  return { from: startOfMonthIso(iso), to: endOfMonthIso(iso) };
}

const isValidIso = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Границы периода. Всегда [start 00:00:00.000 .. end 23:59:59.999] по Уссурийску. */
export function periodRange(
  period: PeriodKey,
  anchor: Date,
  custom?: CustomRange,
): { start: Date; end: Date } {
  if (period === "all") return { start: ALL_TIME_START, end: ALL_TIME_END };
  const iso = isoDate(anchor);

  if (period === "custom") {
    let from = isValidIso(custom?.from) ? custom!.from : startOfMonthIso(iso);
    let to = isValidIso(custom?.to) ? custom!.to : endOfMonthIso(iso);
    // Перевёрнутый диапазон просто разворачиваем — считаем то, что человек имел в виду.
    if (to < from) [from, to] = [to, from];
    return { start: dayStart(from), end: dayEnd(to) };
  }
  if (period === "day") return { start: dayStart(iso), end: dayEnd(iso) };
  if (period === "week") {
    const s = startOfWeekIso(iso);
    return { start: dayStart(s), end: dayEnd(addDaysIso(s, 6)) };
  }
  return { start: dayStart(startOfMonthIso(iso)), end: dayEnd(endOfMonthIso(iso)) };
}

export function canNavigate(period: PeriodKey) {
  return period === "day" || period === "week" || period === "month";
}

export function stepAnchor(period: PeriodKey, anchor: Date, dir: 1 | -1): Date {
  const iso = isoDate(anchor);
  if (period === "day") return dayStart(addDaysIso(iso, dir));
  if (period === "week") return dayStart(addDaysIso(iso, dir * 7));
  if (period === "month") return dayStart(addMonthsIso(iso, dir));
  return anchor;
}

const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS_GEN[Number(m) - 1]} ${y}`;
};
const fmtDayShort = (iso: string, withYear: boolean) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS_SHORT[Number(m) - 1]}${withYear ? ` ${y}` : ""}`;
};

export function periodRangeLabel(
  period: PeriodKey,
  anchor: Date,
  custom?: CustomRange,
): string {
  if (period === "all") return "Всё время";
  const { start, end } = periodRange(period, anchor, custom);
  const sIso = isoDate(start);
  const eIso = isoDate(end);
  if (period === "day") return fmtDay(sIso);
  if (period === "month") {
    const [y, m] = sIso.split("-");
    return `${MONTHS_NOM[Number(m) - 1]} ${y}`;
  }
  const sameMonth = sIso.slice(0, 7) === eIso.slice(0, 7);
  return `${sameMonth ? Number(sIso.slice(8)) : fmtDayShort(sIso, false)} – ${fmtDayShort(eIso, true)}`;
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
  const now = todayIso();
  const iso = isoDate(anchor);
  if (period === "day") return iso === now;
  if (period === "week") return startOfWeekIso(iso) === startOfWeekIso(now);
  if (period === "month") return iso.slice(0, 7) === now.slice(0, 7);
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
