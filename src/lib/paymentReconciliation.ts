import { ussDateISO } from "@/lib/tz";

type Work = { id: string; starts_at: string; status: string; total_price: number | null; paid_amount?: number | null };
type Payment = { id: string; appointment_id: string; amount: number; paid_at: string };

/** Compare work-date totals with payment-date receipts without moving any money. */
export function reconcilePayments(works: Work[], payments: Payment[], from: string, to: string) {
  const periodWorks = works.filter((a) => {
    const date = ussDateISO(new Date(a.starts_at));
    return date >= from && date <= to && a.status !== "cancelled";
  });
  const workIds = new Set(periodWorks.map((a) => a.id));
  const periodPayments = payments.filter((p) => p.paid_at >= from && p.paid_at <= to);
  const matchingPayments = periodPayments.filter((p) => workIds.has(p.appointment_id));
  const otherPayments = periodPayments.filter((p) => !workIds.has(p.appointment_id));
  const workTotal = periodWorks.reduce((s, a) => s + Number(a.total_price ?? 0), 0);
  const receipts = periodPayments.reduce((s, p) => s + Number(p.amount), 0);
  const matching = matchingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const other = otherPayments.reduce((s, p) => s + Number(p.amount), 0);
  const paidAllDates = periodWorks.reduce((s, a) => s + Number(a.paid_amount ?? 0), 0);
  return { workTotal, receipts, matching, other, otherPayments, outsideDates: paidAllDates - matching, unpaid: workTotal - paidAllDates, difference: receipts - workTotal };
}