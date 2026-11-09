// Единый часовой пояс для всей CRM — Уссурийск (Asia/Vladivostok, UTC+10, без DST).
// Все "Сегодня/Вчера/Завтра" и предзаполнение даты/времени в диалогах
// считаем в этой зоне, независимо от настроек системного времени браузера.

export const TZ = "Asia/Vladivostok";
const OFFSET_MIN = 10 * 60; // UTC+10, DST в Приморье нет

// Возвращает "yyyy-MM-dd" для инстанта в TZ Уссурийска.
export function ussDateISO(d: Date = new Date()): string {
  const shifted = new Date(d.getTime() + OFFSET_MIN * 60_000);
  return shifted.toISOString().slice(0, 10);
}

// Дата оплаты по умолчанию: если работа была в прошлом месяце — дата работы,
// иначе сегодня (всё по Уссурийску). Чтобы оплата за октябрь не уходила в ноябрь.
export function defaultPaidDate(startsAt: string | Date | null | undefined, now: Date = new Date()): string {
  const today = ussDateISO(now);
  if (!startsAt) return today;
  const work = ussDateISO(new Date(startsAt));
  return work.slice(0, 7) < today.slice(0, 7) ? work : today;
}

// Работа из прошлого месяца относительно сегодняшнего дня (Уссурийск).
export function isPastMonthWork(startsAt: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!startsAt) return false;
  return ussDateISO(new Date(startsAt)).slice(0, 7) < ussDateISO(now).slice(0, 7);
}

// Возвращает "HH:mm" в TZ Уссурийска.
export function ussTimeHM(d: Date = new Date()): string {
  const shifted = new Date(d.getTime() + OFFSET_MIN * 60_000);
  return shifted.toISOString().slice(11, 16);
}

// Разбирает "yyyy-MM-dd" + "HH:mm" как локальное время Уссурийска
// и возвращает соответствующий инстант UTC (Date).
export function ussLocalToInstant(dateStr: string, timeStr: string): Date {
  // Собираем ISO с явным смещением +10:00 — Date парсит корректно.
  const iso = `${dateStr}T${timeStr}:00+10:00`;
  return new Date(iso);
}

function isSameUssDay(a: Date, b: Date): boolean {
  return ussDateISO(a) === ussDateISO(b);
}

export function isTodayUss(d: Date): boolean {
  return isSameUssDay(d, new Date());
}

export function isTomorrowUss(d: Date): boolean {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60_000);
  return isSameUssDay(d, tomorrow);
}

export function isYesterdayUss(d: Date): boolean {
  const yesterday = new Date(Date.now() - 24 * 60 * 60_000);
  return isSameUssDay(d, yesterday);
}

// Ключ для группировки записей по дню (Уссурийск).
export function ussDayKey(d: Date): string {
  return ussDateISO(d);
}
