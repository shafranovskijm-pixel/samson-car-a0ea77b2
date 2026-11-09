import { describe, expect, it } from "vitest";
import { defaultPaidDate } from "./tz";

const now = new Date("2026-11-09T09:00:00Z"); // 19:00 Уссурийск, 9 ноября

describe("defaultPaidDate", () => {
  it("работа 31 октября оплачивается в ноябре → дата оплаты 31.10", () => {
    expect(defaultPaidDate("2026-10-31T05:00:00Z", now)).toBe("2026-10-31");
  });
  it("работа 30.10 в 23:00 UTC это уже 31.10 по Уссурийску", () => {
    expect(defaultPaidDate("2026-10-30T23:00:00Z", now)).toBe("2026-10-31");
  });
  it("работа текущего месяца → сегодня", () => {
    expect(defaultPaidDate("2026-11-02T01:00:00Z", now)).toBe("2026-11-09");
  });
});
