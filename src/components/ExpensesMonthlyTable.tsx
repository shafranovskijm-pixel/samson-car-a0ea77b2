import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Printer, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AppointmentWithRelations, MechanicAdvance } from "@/lib/api";
import { effectivePercent, effectivePayout, type PayoutMechanic, type PayoutService } from "@/lib/payouts";

type Row = {
  date: string; // ISO date-only
  dateLabel: string; // "20.07"
  car: string;
  plate: string;
  work: string;
  mechanic: string;
  mechanicId: string | null;
  percent: number;
  price: number;
  payout: number;
  advance: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";

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

  const rows = useMemo<Row[]>(() => {
    // Аванс мастера — по одному разу за конкретный день (в первой строке этого мастера за день).
    const advByMechDay = new Map<string, number>(); // key = mechId|YYYY-MM-DD
    advances.forEach((a) => {
      const key = `${a.mechanic_id}|${a.paid_at.slice(0, 10)}`;
      advByMechDay.set(key, (advByMechDay.get(key) ?? 0) + Number(a.amount ?? 0));
    });
    const usedAdvance = new Set<string>();

    const out: Row[] = [];
    // Стабильная сортировка: по времени старта.
    const sortedAppts = [...appts].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    for (const a of sortedAppts) {
      if (a.status !== "done") continue;
      const dateOnly = a.starts_at.slice(0, 10);
      const carName = [a.car?.brand?.name, a.car?.model].filter(Boolean).join(" ") || "—";
      const plate = a.car?.license_plate ?? "";
      const mechName = a.mechanic?.full_name ?? "—";
      const mechanicId = a.mechanic_id;

      const services = a.services ?? [];
      if (services.length === 0) continue;

      services.forEach((s, idx) => {
        const price = Number(s.price ?? 0);
        const stored = Number(s.mechanic_payout ?? 0);
        const mech = mechanicId ? mechById.get(mechanicId) ?? null : null;
        const svc = s.service_id ? svcById.get(s.service_id) ?? null : null;
        const percent = effectivePercent(mech, svc);
        const payout = effectivePayout({ storedPayout: stored, price, mechanic: mech, service: svc });

        // Аванс приклеиваем только к первой строке этого мастера в этот день.
        let advance = 0;
        if (mechanicId && idx === 0) {
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
          mechanic: mechName,
          mechanicId,
          percent,
          price,
          payout,
          advance,
        });
      });
    }

    // Не привязанные к работам авансы (по дням, где у мастера не было работ) — добавляем отдельной строкой.
    // Пробегаем все day+mech, которых не «использовали».
    advByMechDay.forEach((amount, key) => {
      if (usedAdvance.has(key) || amount <= 0) return;
      const [mechanicId, dateOnly] = key.split("|");
      const mech = mechanics.find((m) => m.id === mechanicId);
      out.push({
        date: dateOnly,
        dateLabel: format(parseISO(dateOnly), "dd.MM"),
        car: "—",
        plate: "",
        work: "Аванс",
        mechanic: mech?.full_name ?? "—",
        mechanicId,
        percent: 0,
        price: 0,
        payout: 0,
        advance: amount,
      });
    });

    // Сортируем по дате.
    out.sort((a, b) => a.date.localeCompare(b.date));
    return out;
  }, [appts, advances, mechById, svcById, mechanics]);

  const filtered = useMemo(
    () => (mechFilter === "all" ? rows : rows.filter((r) => r.mechanicId === mechFilter)),
    [rows, mechFilter],
  );

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => {
          acc.price += r.price;
          acc.payout += r.payout;
          acc.advance += r.advance;
          return acc;
        },
        { price: 0, payout: 0, advance: 0 },
      ),
    [filtered],
  );

  const monthLabel = format(month, "LLLL yyyy", { locale: ru });

  const handlePrint = () => {
    window.print();
  };

  const handleExcel = () => {
    const header = [
      "Число",
      "Марка / машина",
      "Гос. номер",
      "Работа",
      "Мастер",
      "%",
      "Сумма работы",
      "ЗП мастера",
      "Аванс",
    ];
    const data = filtered.map((r) => [
      r.dateLabel,
      r.car,
      r.plate,
      r.work,
      r.mechanic,
      r.percent ? `${r.percent}%` : "",
      r.price || "",
      r.payout || "",
      r.advance || "",
    ]);
    const totalRow = ["", "", "", "", "ИТОГО", "", totals.price, totals.payout, totals.advance];
    const ws = XLSX.utils.aoa_to_sheet([header, ...data, totalRow]);
    ws["!cols"] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
      { wch: 18 },
      { wch: 6 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
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
              Работы, начисления мастерам и авансы — одной таблицей
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mechFilter}
              onChange={(e) => setMechFilter(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Все мастера</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
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
            {mechFilter !== "all" && (
              <div className="text-sm">
                Мастер: {mechanics.find((m) => m.id === mechFilter)?.full_name ?? "—"}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              За выбранный месяц данных нет.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="expense-table w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 py-2">Число</th>
                    <th className="px-2 py-2">Марка / машина</th>
                    <th className="px-2 py-2">Гос. №</th>
                    <th className="px-2 py-2">Работа</th>
                    <th className="px-2 py-2">Мастер</th>
                    <th className="px-2 py-2 text-right">%</th>
                    <th className="px-2 py-2 text-right">Сумма</th>
                    <th className="px-2 py-2 text-right">ЗП</th>
                    <th className="px-2 py-2 text-right">Аванс</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="whitespace-nowrap px-2 py-2 tabular-nums">{r.dateLabel}</td>
                      <td className="px-2 py-2">{r.car}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                        {r.plate}
                      </td>
                      <td className="px-2 py-2">{r.work}</td>
                      <td className="whitespace-nowrap px-2 py-2">{r.mechanic}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                        {r.percent ? `${r.percent}%` : ""}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                        {r.price ? fmt(r.price) : ""}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-amber-700">
                        {r.payout ? fmt(r.payout) : ""}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-red-600">
                        {r.advance ? fmt(r.advance) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/40 font-semibold">
                    <td className="px-2 py-2" colSpan={5}>
                      ИТОГО
                    </td>
                    <td className="px-2 py-2" />
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                      {fmt(totals.price)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-amber-700">
                      {fmt(totals.payout)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-red-600">
                      {fmt(totals.advance)}
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
