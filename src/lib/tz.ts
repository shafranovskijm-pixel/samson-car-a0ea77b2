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
