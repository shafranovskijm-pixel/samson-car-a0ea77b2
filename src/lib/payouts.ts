// Единая формула выплаты мастеру за одну услугу.
// Приоритет:
//   1) сохранённая в БД сумма mechanic_payout, если > 0 (ручная правка/индивидуальная ставка мастера за услугу);
//   2) индивидуальный % мастера (mechanics.default_payout_percent), если задан;
//   3) % услуги (services.default_payout_percent), если задан;
//   4) 50% по умолчанию.

export type PayoutMechanic = { default_payout_percent?: number | null } | null | undefined;
export type PayoutService = { default_payout_percent?: number | null } | null | undefined;

export const DEFAULT_PAYOUT_PERCENT = 50;

export function effectivePercent(
  mechanic?: PayoutMechanic,
  service?: PayoutService,
): number {
  const mp = Number(mechanic?.default_payout_percent);
  if (Number.isFinite(mp) && mp > 0) return mp;
  const sp = Number(service?.default_payout_percent);
  if (Number.isFinite(sp) && sp > 0) return sp;
  return DEFAULT_PAYOUT_PERCENT;
}

export function effectivePayout(params: {
  storedPayout?: number | null;
  price: number | null | undefined;
  mechanic?: PayoutMechanic;
  service?: PayoutService;
}): number {
  const stored = Number(params.storedPayout ?? 0);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
  const price = Number(params.price ?? 0) || 0;
  const pct = effectivePercent(params.mechanic, params.service);
  return Math.round((price * pct) / 100);
}
