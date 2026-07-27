import { Fragment, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Printer, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AppointmentWithRelations, MechanicAdvance } from "@/lib/api";
import {
  effectivePercent,
  effectivePayout,
  type PayoutMechanic,
  type PayoutService,
} from "@/lib/payouts";

type Cell = { percent: number; price: number; payout: number; advance: number };
type Row = {
  date: string; // ISO date-only
  dateLabel: string;
  car: string;
  plate: string;
  work: string;
  // key: mechanicId -> cell values (only one non-empty per row typically)
  byMech: Record<string, Cell>;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";

const UNASSIGNED = "__unassigned__";

export function ExpensesMonthlyTable({
  month,
  appts,
  mechanics,
  advances,
  mechById,
  svcById,
}: {
  month: Date;
  appts: AppointmentWithRelations[];
  mechanics: { id: string; full_name: string }[];
  advances: MechanicAdvance[];
  mechById: Map<string, PayoutMechanic>;
  svcById: Map<string, PayoutService>;
}) {
  const [mechFilter, setMechFilter] = useState<string>("all");

  // Полный список «колонок»-мастеров (включая «Без мастера» если такие работы/авансы есть)
  const allMechColumns = useMemo(() => {
    const list: { id: string; name: string }[] = mechanics.map((m) => ({
      id: m.id,
      name: m.full_name,
    }));
    const needUnassigned =
      appts.some((a) => a.status === "done" && !a.mechanic_id && (a.services ?? []).length > 0) ||
      advances.some((a) => !a.mechanic_id);
    if (needUnassigned) list.push({ id: UNASSIGNED, name: "Без мастера" });
    return list;
  }, [mechanics, appts, advances]);

  const visibleMechs = useMemo(
    () => (mechFilter === "all" ? allMechColumns : allMechColumns.filter((m) => m.id === mechFilter)),
    [allMechColumns, mechFilter],
  );

  const rows = useMemo<Row[]>(() => {
    // Аванс мастера — по одному разу за конкретный день (в первой строке этого мастера за день).
    const advByMechDay = new Map<string, number>(); // key = mechId|YYYY-MM-DD
    advances.forEach((a) => {
      const key = `${a.mechanic_id ?? UNASSIGNED}|${a.paid_at.slice(0, 10)}`;
      advByMechDay.set(key, (advByMechDay.get(key) ?? 0) + Number(a.amount ?? 0));
    });
    const usedAdvance = new Set<string>();

    const out: Row[] = [];
    const sortedAppts = [...appts].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    for (const a of sortedAppts) {
      if (a.status !== "done") continue;
      const dateOnly = a.starts_at.slice(0, 10);
      const carName = [a.car?.brand?.name, a.car?.model].filter(Boolean).join(" ") || "—";
      const plate = a.car?.license_plate ?? "";
      const mechanicId = a.mechanic_id ?? UNASSIGNED;

      const services = a.services ?? [];
      if (services.length === 0) continue;

      services.forEach((s, idx) => {
        const price = Number(s.price ?? 0);
        const stored = Number(s.mechanic_payout ?? 0);
        const mech = a.mechanic_id ? mechById.get(a.mechanic_id) ?? null : null;
        const svc = s.service_id ? svcById.get(s.service_id) ?? null : null;
        const percent = effectivePercent(mech, svc);
        const payout = effectivePayout({ storedPayout: stored, price, mechanic: mech, service: svc });

        let advance = 0;
        if (idx === 0) {
          const key = `${mechanicId}|${dateOnly}`;
          if (!usedAdvance.has(key)) {
            advance = advByMechDay.get(key) ?? 0;
            if (advance > 0) usedAdvance.add(key);
          }
        }

        out.push({
          date: dateOnly,
          dateLabel: format(parseISO(dateOnly), "dd.MM"),
          car: carName,
          plate,
          work: s.service?.name ?? "Услуга",
          byMech: { [mechanicId]: { percent, price, payout, advance } },
        });
      });
    }

    // Висячие авансы — дни, где у мастера не было работ.
    advByMechDay.forEach((amount, key) => {
      if (usedAdvance.has(key) || amount <= 0) return;
      const [mechanicId, dateOnly] = key.split("|");
      out.push({
        date: dateOnly,
        dateLabel: format(parseISO(dateOnly), "dd.MM"),
        car: "—",
        plate: "",
        work: "Аванс",
        byMech: { [mechanicId]: { percent: 0, price: 0, payout: 0, advance: amount } },
      });
    });

    out.sort((a, b) => a.date.localeCompare(b.date));
    return out;
  }, [appts, advances, mechById, svcById]);

  // Фильтр по мастеру: оставляем строки, где у выбранного мастера что-то есть
  const filteredRows = useMemo(() => {
    if (mechFilter === "all") return rows;
    return rows.filter((r) => {
      const c = r.byMech[mechFilter];
      return c && (c.price > 0 || c.payout > 0 || c.advance > 0);
    });
  }, [rows, mechFilter]);

  // Итоги по колонкам мастеров
  const totalsByMech = useMemo(() => {
    const map = new Map<string, Cell>();
    visibleMechs.forEach((m) => map.set(m.id, { percent: 0, price: 0, payout: 0, advance: 0 }));
    filteredRows.forEach((r) => {
      visibleMechs.forEach((m) => {
        const c = r.byMech[m.id];
        if (!c) return;
        const t = map.get(m.id)!;
        t.price += c.price;
        t.payout += c.payout;
        t.advance += c.advance;
      });
    });
    return map;
  }, [filteredRows, visibleMechs]);

  const grandTotals = useMemo(() => {
    const acc = { price: 0, payout: 0, advance: 0 };
    totalsByMech.forEach((t) => {
      acc.price += t.price;
      acc.payout += t.payout;
      acc.advance += t.advance;
    });
    return acc;
  }, [totalsByMech]);

  const monthLabel = format(month, "LLLL yyyy", { locale: ru });

  const handlePrint = () => window.print();

  const handleExcel = () => {
    // Двухрядовая шапка: [Число | Марка | Гос. № | Работа | Мастер1 (merged 4) | Мастер2 …]
    // Строка ниже: [ | | | | % | Сумма | ЗП | Аванс | % | Сумма | ЗП | Аванс | …]
    const topRow: (string | number)[] = ["Число", "Марка / машина", "Гос. №", "Работа"];
    visibleMechs.forEach((m) => topRow.push(m.name, "", "", ""));
    const subRow: (string | number)[] = ["", "", "", ""];
    visibleMechs.forEach(() => subRow.push("%", "Сумма", "ЗП", "Аванс"));

    const dataRows = filteredRows.map((r) => {
      const row: (string | number)[] = [r.dateLabel, r.car, r.plate, r.work];
      visibleMechs.forEach((m) => {
        const c = r.byMech[m.id];
        if (!c) {
          row.push("", "", "", "");
          return;
        }
        row.push(c.percent ? `${c.percent}%` : "", c.price || "", c.payout || "", c.advance || "");
      });
      return row;
    });

    const totalsRow: (string | number)[] = ["", "", "", "ИТОГО"];
    visibleMechs.forEach((m) => {
      const t = totalsByMech.get(m.id)!;
      totalsRow.push("", t.price || "", t.payout || "", t.advance || "");
    });

    const grandRow: (string | number)[] = [
      "",
      "",
      "",
      "ВСЕГО",
      ...Array(visibleMechs.length * 4 - 3).fill(""),
      `Сумма: ${grandTotals.price} · ЗП: ${grandTotals.payout} · Аванс: ${grandTotals.advance}`,
    ];

    const ws = XLSX.utils.aoa_to_sheet([topRow, subRow, ...dataRows, totalsRow, grandRow]);
    // Объединяем ячейки шапки для каждого мастера
    ws["!merges"] = ws["!merges"] ?? [];
    visibleMechs.forEach((_, idx) => {
      const start = 4 + idx * 4;
      ws["!merges"]!.push({ s: { r: 0, c: start }, e: { r: 0, c: start + 3 } });
    });
    // Ширины
    ws["!cols"] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
      ...visibleMechs.flatMap(() => [{ wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 10 }]),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Свод");
    const safeMonth = format(month, "yyyy-MM");
    XLSX.writeFile(wb, `Свод_${safeMonth}.xlsx`);
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold sm:text-lg">Сводная за {monthLabel}</h3>
            <p className="text-xs text-muted-foreground">
              Колонка на каждого мастера — работы, ЗП и авансы
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mechFilter}
              onChange={(e) => setMechFilter(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Все мастера</option>
              {allMechColumns.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={handleExcel}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1.5 h-4 w-4" />
              Печать
            </Button>
          </div>
        </div>

        <div className="print-area">
          <div className="print-only mb-3">
            <div className="text-lg font-bold">Сводная за {monthLabel}</div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              За выбранный месяц данных нет.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="expense-table w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th rowSpan={2} className="px-2 py-2 text-left align-bottom">
                      Число
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-left align-bottom">
                      Марка / машина
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-left align-bottom">
                      Гос. №
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-left align-bottom">
                      Работа
                    </th>
                    {visibleMechs.map((m) => (
                      <th
                        key={m.id}
                        colSpan={4}
                        className="border-l px-2 py-2 text-center font-semibold text-foreground"
                      >
                        {m.name}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {visibleMechs.map((m) => (
                      <>
                        <th key={`${m.id}-p`} className="border-l px-2 py-1.5 text-right">
                          %
                        </th>
                        <th key={`${m.id}-s`} className="px-2 py-1.5 text-right">
                          Сумма
                        </th>
                        <th key={`${m.id}-z`} className="px-2 py-1.5 text-right">
                          ЗП
                        </th>
                        <th key={`${m.id}-a`} className="px-2 py-1.5 text-right">
                          Аванс
                        </th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="whitespace-nowrap px-2 py-2 tabular-nums">{r.dateLabel}</td>
                      <td className="px-2 py-2">{r.car}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                        {r.plate}
                      </td>
                      <td className="px-2 py-2">{r.work}</td>
                      {visibleMechs.map((m) => {
                        const c = r.byMech[m.id];
                        if (!c) {
                          return (
                            <>
                              <td key={`${m.id}-p`} className="border-l px-2 py-2 text-right text-muted-foreground">
                                —
                              </td>
                              <td key={`${m.id}-s`} className="px-2 py-2 text-right text-muted-foreground">
                                —
                              </td>
                              <td key={`${m.id}-z`} className="px-2 py-2 text-right text-muted-foreground">
                                —
                              </td>
                              <td key={`${m.id}-a`} className="px-2 py-2 text-right text-muted-foreground">
                                —
                              </td>
                            </>
                          );
                        }
                        return (
                          <>
                            <td
                              key={`${m.id}-p`}
                              className="whitespace-nowrap border-l px-2 py-2 text-right tabular-nums"
                            >
                              {c.percent ? `${c.percent}%` : ""}
                            </td>
                            <td
                              key={`${m.id}-s`}
                              className="whitespace-nowrap px-2 py-2 text-right tabular-nums"
                            >
                              {c.price ? fmt(c.price) : ""}
                            </td>
                            <td
                              key={`${m.id}-z`}
                              className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-amber-700"
                            >
                              {c.payout ? fmt(c.payout) : ""}
                            </td>
                            <td
                              key={`${m.id}-a`}
                              className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-red-600"
                            >
                              {c.advance ? fmt(c.advance) : ""}
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/40 font-semibold">
                    <td className="px-2 py-2" colSpan={4}>
                      ИТОГО
                    </td>
                    {visibleMechs.map((m) => {
                      const t = totalsByMech.get(m.id)!;
                      return (
                        <>
                          <td key={`${m.id}-tp`} className="border-l px-2 py-2 text-right" />
                          <td
                            key={`${m.id}-ts`}
                            className="whitespace-nowrap px-2 py-2 text-right tabular-nums"
                          >
                            {fmt(t.price)}
                          </td>
                          <td
                            key={`${m.id}-tz`}
                            className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-amber-700"
                          >
                            {fmt(t.payout)}
                          </td>
                          <td
                            key={`${m.id}-ta`}
                            className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-red-600"
                          >
                            {fmt(t.advance)}
                          </td>
                        </>
                      );
                    })}
                  </tr>
                  <tr className="border-t bg-muted/20 text-xs">
                    <td className="px-2 py-2 font-semibold" colSpan={4 + visibleMechs.length * 4}>
                      ВСЕГО по всем мастерам: Сумма{" "}
                      <span className="font-bold">{fmt(grandTotals.price)}</span> · ЗП{" "}
                      <span className="font-bold text-amber-700">{fmt(grandTotals.payout)}</span> ·
                      Аванс{" "}
                      <span className="font-bold text-red-600">{fmt(grandTotals.advance)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
