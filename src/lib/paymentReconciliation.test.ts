import { describe, expect, it } from "vitest";
import { reconcilePayments } from "./paymentReconciliation";

const work = (id: string, starts_at: string, total_price: number, paid_amount: number) => ({ id, starts_at, total_price, paid_amount, status: "done" });
const payment = (id: string, appointment_id: string, amount: number, paid_at = "2026-11-18") => ({ id, appointment_id, amount, paid_at });
const from = "2026-11-01", to = "2026-11-30";

describe("work-date and payment-date reconciliation", () => {
  it("shows why receipts exceed works when an October work is paid in November", () => {
    const result = reconcilePayments([work("nov", "2026-11-05T00:00:00Z", 1000, 1000), work("oct", "2026-10-15T00:00:00Z", 500, 500)], [payment("1", "nov", 1000), payment("2", "oct", 500)], from, to);
    expect(result).toMatchObject({ workTotal: 1000, receipts: 1500, other: 500, difference: 500 });
    expect(result.otherPayments.map((p) => p.id)).toEqual(["2"]);
  });
  it("accounts for unpaid works and payments made outside the period separately", () => {
    const result = reconcilePayments([work("a", "2026-11-05T00:00:00Z", 2000, 1500)], [payment("1", "a", 1000), payment("2", "a", 500, "2026-12-01")], from, to);
    expect(result).toMatchObject({ receipts: 1000, outsideDates: 500, unpaid: 500, difference: -1000 });
  });
  it("recomputes a deleted November payment re-entered in October without duplication", () => {
    const works = [work("a", "2026-10-15T00:00:00Z", 1234, 1234)];
    expect(reconcilePayments(works, [payment("old", "a", 1234)], from, to).receipts).toBe(1234);
    expect(reconcilePayments(works, [], from, to).receipts).toBe(0);
    expect(reconcilePayments(works, [payment("new", "a", 1234, "2026-10-15")], from, to).receipts).toBe(0);
    expect(reconcilePayments(works, [payment("new", "a", 1234, "2026-10-15")], "2026-10-01", "2026-10-31").receipts).toBe(1234);
  });
  it("uses UTC+10 for works at a month boundary", () => {
    expect(reconcilePayments([work("a", "2026-10-31T15:00:00Z", 800, 800)], [payment("1", "a", 800)], from, to)).toMatchObject({ matching: 800, other: 0 });
  });
});