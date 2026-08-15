import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AppointmentWithRelations,
  AppointmentPayment,
  Expense,
  MechanicAdvance,
} from "@/lib/api";
import {
  effectivePercent,
  effectivePayout,
  type PayoutMechanic,
  type PayoutService,
} from "@/lib/payouts";

export type DrillMetric = "profit" | "income" | "payout" | "expense" | "debt";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  ) + " ₽";

const fmtDate = (iso: string) =>
  format(parseISO(iso.length > 10 ? iso : iso + "T00:00:00"), "d MMM yyyy", {
    locale: ru,
  });

type Props = {
  metric: DrillMetric | null;
  onClose: () => void;
  onOpenMetric: (m: DrillMetric) => void;
  periodLabel: string;
  rangeLabel: string;
  appts: AppointmentWithRelations[];
  doneAppts: AppointmentWithRelations[];
  upcomingAppts: AppointmentWithRelations[];
  payments: AppointmentPayment[];
  expenses: Expense[];
  advances: MechanicAdvance[];
  mechanics: { id: string; full_name: string }[];
  mechById: Map<string, PayoutMechanic>;
  svcById: Map<string, PayoutService>;
  revenue: number;
  mechanicsAccrued: number;
  /** ЗП кассовым методом: доля выплат мастерам от фактических платежей периода. */
  cashPayout: number;
  otherExpenses: number;
  cashProfit: number;
  /** Входящий долг/переплата до начала текущего периода. */
  openingDebt: number;
  /** Всего выплачено мастерам за текущий период (авансы + расходы ЗП). */
  mechanicsPaid: number;
  /** Итоговый долг/переплата мастерам на конец периода. */
  mechanicsDebtTotal: number;
  /** Все выплаты мастерам до конца периода (для прогресса). */
  paidToDate?: number;
  /** Все начисления мастерам до конца периода (для прогресса). */
  accruedToDate?: number;
};

const TITLE: Record<DrillMetric, string> = {
  profit: "Чистая прибыль",
  income: "Доходы (касса)",
  payout: "Зарплаты мастеров",
  expense: "Прочие расходы",
  debt: "Долг / переплата мастерам",
};

export function ExpensesDrillDown(props: Props) {
  const { metric, onClose } = props;
  return (
    <Dialog open={metric !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="border-b p-4 sm:p-6">
          <DialogTitle className="text-lg">
            {metric ? TITLE[metric] : ""}
          </DialogTitle>
          <div className="text-xs text-muted-foreground">
            За {props.periodLabel} · {props.rangeLabel}
          </div>
        </DialogHeader>
        <div className="p-4 sm:p-6">
          {metric === "profit" && <ProfitView {...props} />}
          {metric === "income" && <IncomeView {...props} />}
          {metric === "payout" && <PayoutView {...props} />}
          {metric === "expense" && <ExpenseView {...props} />}
          {metric === "debt" && <DebtView {...props} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  tone,
  onClick,
  strong,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn" | "neutral";
  onClick?: () => void;
  strong?: boolean;
}) {
  const toneCls =
    tone === "good"
      ? "text-green-600"
      : tone === "bad"
        ? "text-red-600"
        : tone === "warn"
          ? "text-amber-600"
          : "text-foreground";
  const base =
    "flex items-center justify-between gap-3 rounded-lg border p-3 text-sm";
  const cls = onClick
    ? `${base} cursor-pointer transition-colors hover:bg-muted/60`
    : base;
  return (
    <div
      className={cls}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <span className={strong ? "font-semibold" : ""}>{label}</span>
      <span
        className={`tabular-nums ${strong ? "font-bold" : "font-semibold"} ${toneCls}`}
      >
        {value}
      </span>
    </div>
  );
}

function ProfitView(p: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-green-500/30 bg-green-50 p-4 dark:bg-green-950/20">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Чистая прибыль за {p.periodLabel}
        </div>
        <div
          className={`mt-1 text-3xl font-bold tabular-nums ${p.cashProfit >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {fmt(p.cashProfit)}
        </div>
        <div className="mt-3 rounded-md bg-background p-3 font-mono text-xs leading-6">
          Прибыль = Касса − ЗП по оплаченным работам − Прочие расходы
          <br />
          <span className={p.cashProfit >= 0 ? "text-green-600" : "text-red-600"}>
            {fmt(p.cashProfit)}
          </span>{" "}
          = {fmt(p.revenue)} − {fmt(p.cashPayout)} − {fmt(p.otherExpenses)}
        </div>
      </div>
      <div className="space-y-2">
        <Row
          label="Касса (платежи клиентов)"
          value={"+ " + fmt(p.revenue)}
          tone="good"
          onClick={() => p.onOpenMetric("income")}
        />
        <Row
          label="ЗП мастеров с оплаченных работ"
          value={"− " + fmt(p.cashPayout)}
          tone="warn"
          onClick={() => p.onOpenMetric("payout")}
        />
        <Row
          label="Прочие расходы (без выплат ЗП)"
          value={"− " + fmt(p.otherExpenses)}
          tone="warn"
          onClick={() => p.onOpenMetric("expense")}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Учитываем кассовые поступления в этот период. Начисленная ЗП считается
        по услугам в выполненных за период записях. Нажмите на строку —
        раскроется расшифровка.
      </p>
    </div>
  );
}

function IncomeView(p: Props) {
  const apptMap = useMemo(() => {
    const m = new Map<string, AppointmentWithRelations>();
    p.appts.forEach((a) => m.set(a.id, a));
    return m;
  }, [p.appts]);

  const paymentsSorted = useMemo(
    () => [...p.payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at)),
    [p.payments],
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Всего поступило
        </div>
        <div className="mt-1 text-3xl font-bold tabular-nums">
          {fmt(p.revenue)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {p.payments.length} платеж
          {p.payments.length === 1
            ? ""
            : p.payments.length < 5
              ? "а"
              : "ей"}{" "}
          по дате оплаты
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">Список платежей</div>
        {paymentsSorted.length === 0 ? (
          <div className="rounded border border-dashed py-8 text-center text-sm text-muted-foreground">
            Платежей за период не было.
          </div>
        ) : (
          <div className="space-y-1.5">
            {paymentsSorted.map((pay) => {
              const a = apptMap.get(pay.appointment_id);
              const client = a?.car?.client?.full_name ?? "—";
              const car = a
                ? `${a.car?.brand?.name ?? ""} ${a.car?.model ?? ""}`.trim()
                : "";
              const plate = a?.car?.license_plate ?? "";
              const services = (a?.services ?? [])
                .map((s) => s.service?.name)
                .filter(Boolean) as string[];
              return (
                <div
                  key={pay.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {client}
                      {car ? ` · ${car}` : ""}
                      {plate ? ` · ${plate}` : ""}
                    </div>
                    {services.length > 0 && (
                      <div className="truncate text-foreground/80">
                        {services.join(", ")}
                      </div>
                    )}
                    <div className="truncate text-muted-foreground">
                      {fmtDate(pay.paid_at)}
                      {pay.method ? ` · ${pay.method}` : ""}
                      {pay.note ? ` · ${pay.note}` : ""}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-green-700 tabular-nums">
                    + {fmt(Number(pay.amount))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">
          Ожидается: неоплаченные записи
        </div>
        {p.upcomingAppts.length === 0 ? (
          <div className="rounded border border-dashed py-6 text-center text-xs text-muted-foreground">
            Все предстоящие записи оплачены.
          </div>
        ) : (
          <div className="space-y-1.5">
            {p.upcomingAppts.map((a) => {
              const debt = Math.max(
                0,
                (a.total_price ?? 0) - Number(a.paid_amount ?? 0),
              );
              if (debt <= 0) return null;
              return (
                <div
                  key={a.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {a.car?.client?.full_name ?? "—"} ·{" "}
                      {a.car?.brand?.name ?? ""} {a.car?.model ?? ""}
                    </div>
                    <div className="truncate text-muted-foreground">
                      {format(parseISO(a.starts_at), "d MMM, HH:mm", {
                        locale: ru,
                      })}{" "}
                      · оплачено {fmt(Number(a.paid_amount ?? 0))} из{" "}
                      {fmt(a.total_price ?? 0)}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-amber-600 tabular-nums">
                    {fmt(debt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutView(p: Props) {
  const mechName = useMemo(() => {
    const m = new Map<string, string>();
    p.mechanics.forEach((x) => m.set(x.id, x.full_name));
    return m;
  }, [p.mechanics]);

  type Line = {
    apptId: string;
    starts_at: string;
    client: string;
    car: string;
    service: string;
    price: number;
    percent: number;
    payout: number;
    stored: number;
  };
  type Group = {
    mechId: string | null;
    name: string;
    lines: Line[];
    total: number;
    advances: number;
  };

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    const keyOf = (id: string | null) => id ?? "__none";
    p.doneAppts.forEach((a) => {
      const mid = a.mechanic_id ?? null;
      const g =
        map.get(keyOf(mid)) ??
        ({
          mechId: mid,
          name: mid ? mechName.get(mid) ?? "Мастер" : "Без мастера",
          lines: [],
          total: 0,
          advances: 0,
        } as Group);
      const mech = mid ? p.mechById.get(mid) ?? null : null;
      (a.services ?? []).forEach((s) => {
        const price = Number(s.price ?? 0);
        const stored = Number(s.mechanic_payout ?? 0);
        const svc = s.service_id ? p.svcById.get(s.service_id) ?? null : null;
        const percent = effectivePercent(mech, svc);
        const payout = effectivePayout({
          storedPayout: stored,
          price,
          mechanic: mech,
          service: svc,
        });
        g.lines.push({
          apptId: a.id,
          starts_at: a.starts_at,
          client: a.car?.client?.full_name ?? "—",
          car: `${a.car?.brand?.name ?? ""} ${a.car?.model ?? ""}`.trim(),
          service: s.service?.name ?? "Услуга",
          price,
          percent,
          payout,
          stored,
        });
        g.total += payout;
      });
      map.set(keyOf(mid), g);
    });
    p.advances.forEach((adv) => {
      const g = map.get(adv.mechanic_id);
      if (g) g.advances += Number(adv.amount ?? 0);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [p.doneAppts, p.advances, p.mechById, p.svcById, mechName]);

  const totalAccrued = groups.reduce((s, g) => s + g.total, 0);
  const totalAdvances = p.advances.reduce((s, a) => s + Number(a.amount ?? 0), 0);
  const totalToPay = totalAccrued - totalAdvances;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Начислено мастерам
        </div>
        <div className="mt-1 text-3xl font-bold text-amber-600 tabular-nums">
          {fmt(p.mechanicsAccrued)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          В прибыль за период попадает ЗП с фактически оплаченных работ:{" "}
          <span className="font-semibold text-foreground">{fmt(p.cashPayout)}</span>
        </div>

        <div className="mt-2 rounded-md border bg-muted/30 p-3 text-xs leading-6">
          Формула по услуге: ставка мастера, если задана; иначе % услуги;
          иначе 50%. Если в услуге вручную указана сумма выплаты — берётся она.
          <br />
          <span className="font-mono">
            ЗП = цена × % ÷ 100
          </span>
        </div>
      </div>

      {/* Расшифровка «К выплате» */}
      <div className="rounded-lg border p-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Остаток к выплате мастерам
        </div>
        <div className="mt-2 space-y-1 text-sm tabular-nums">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Начислено за период</span>
            <span className="font-medium">{fmt(totalAccrued)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              − уже выплачено (авансы за период)
            </span>
            <span className="font-medium">{fmt(totalAdvances)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-1">
            <span className="font-semibold">
              = {totalToPay >= 0 ? "К выплате" : "Переплата"}
            </span>
            <span
              className={`font-bold ${totalToPay >= 0 ? "text-amber-600" : "text-red-600"}`}
            >
              {fmt(Math.abs(totalToPay))}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[11px] leading-5 text-muted-foreground">
          Это сколько ещё нужно отдать мастерам на руки: заработанное за период
          минус уже выданные авансы. На чистую прибыль влияет начисленная ЗП, а
          не эта сумма.
        </div>
        {p.advances.length > 0 && (
          <div className="mt-3 divide-y border-t pt-2 text-xs">
            {p.advances.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate">
                  {mechName.get(a.mechanic_id) ?? "Мастер"}
                  <span className="text-muted-foreground">
                    {" · "}
                    {a.paid_at}
                    {a.note ? ` · ${a.note}` : ""}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums font-medium">
                  {fmt(Number(a.amount ?? 0))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>


      {groups.length === 0 ? (
        <div className="rounded border border-dashed py-8 text-center text-sm text-muted-foreground">
          В этом периоде нет выполненных работ.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const toPay = g.total - g.advances;
            return (
              <div key={g.mechId ?? "none"} className="rounded-lg border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 p-3">
                  <div className="font-semibold">{g.name}</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Начислено {fmt(g.total)}</Badge>
                    <Badge variant="outline">Аванс {fmt(g.advances)}</Badge>
                    <Badge
                      className={
                        toPay >= 0
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }
                    >
                      К выплате {fmt(toPay)}
                    </Badge>
                  </div>
                </div>
                <div className="divide-y">
                  {g.lines
                    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
                    .map((l, i) => (
                      <div
                        key={`${l.apptId}-${i}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{l.service}</div>
                          <div className="truncate text-muted-foreground">
                            {format(parseISO(l.starts_at), "d MMM", {
                              locale: ru,
                            })}{" "}
                            · {l.client}
                            {l.car ? ` · ${l.car}` : ""}
                          </div>
                        </div>
                        <div className="text-right tabular-nums">
                          <div className="font-semibold text-emerald-700">
                            {fmt(l.payout)}
                          </div>
                          <div className="text-muted-foreground">
                            {fmt(l.price)} × {l.percent}%
                            {l.stored > 0 ? " (руч.)" : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DebtView(p: Props) {
  const {
    openingDebt,
    mechanicsAccrued,
    mechanicsPaid,
    mechanicsDebtTotal,
    accruedToDate,
    paidToDate,
  } = p;
  const isOverpaid = mechanicsDebtTotal < 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border-2 border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/20">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {isOverpaid ? "Переплата мастерам" : "Долг мастерам на конец периода"}
        </div>
        <div
          className={`mt-1 text-3xl font-bold tabular-nums ${isOverpaid ? "text-red-600" : "text-amber-600"}`}
        >
          {fmt(Math.abs(mechanicsDebtTotal))}
        </div>
        <div className="mt-3 rounded-md bg-background p-3 font-mono text-xs leading-6">
          {isOverpaid
            ? "Переплата = Выплачено больше, чем начислено"
            : "Долг = Начислено мастерам за всё время − Выплачено за всё время"}
          <br />
          <span className={isOverpaid ? "text-red-600" : "text-amber-600"}>
            {fmt(Math.abs(mechanicsDebtTotal))}
          </span>{" "}
          = {fmt(openingDebt)} + {fmt(mechanicsAccrued)} − {fmt(mechanicsPaid)}
        </div>
      </div>

      <div className="space-y-2">
        <Row
          label="Входящий долг / переплата на начало периода"
          value={openingDebt >= 0 ? fmt(openingDebt) : "− " + fmt(Math.abs(openingDebt))}
          tone={openingDebt > 0 ? "warn" : openingDebt < 0 ? "bad" : "good"}
          strong
        />
        <Row
          label="+ Начислено за текущий период"
          value={fmt(mechanicsAccrued)}
          tone="neutral"
        />
        <Row
          label="− Выплачено за текущий период (авансы + выплаты ЗП)"
          value={fmt(mechanicsPaid)}
          tone="neutral"
        />
        <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-amber-500/20 bg-amber-50/50 p-3 text-sm dark:bg-amber-950/10">
          <span className="font-semibold">
            = {isOverpaid ? "Переплата" : "Долг мастерам"} на конец периода
          </span>
          <span
            className={`font-bold tabular-nums ${isOverpaid ? "text-red-600" : "text-amber-600"}`}
          >
            {fmt(Math.abs(mechanicsDebtTotal))}
          </span>
        </div>
      </div>

      {accruedToDate !== undefined && paidToDate !== undefined && accruedToDate > 0 && (
        <div className="rounded-lg border p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Выплачено за всё время
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{
                width: `${Math.min(100, Math.round((paidToDate / accruedToDate) * 100))}%`,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Начислено: {fmt(accruedToDate)}</span>
            <span>Выплачено: {fmt(paidToDate)}</span>
          </div>
        </div>
      )}

      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Что значит «с прошлых периодов»?</strong>{" "}
          Это разница между начисленной и выплаченной ЗП мастерам, накопленная до
          начала текущего периода. Если число положительное — мы должны мастерам
          деньги за выполненную раньше работу. Если отрицательное — мы выплатили
          больше, чем они уже заработали.
        </p>
        <p>
          <strong className="text-foreground">Почему это важно?</strong>{" "}
          Прибыль считается только по текущему периоду (касса − текущая ЗП −
          расходы). Но долг прошлых месяцев не исчезает: он показывает, сколько
          реально нужно отдать мастерам «сейчас», чтобы закрыть все старые
          обязательства.
        </p>
        <p>
          <strong className="text-foreground">Как используется?</strong>{" "}
          «К выплате» в карточке мастера = его долг за текущий период + его долг
          за все предыдущие периоды. Поэтому общая сумма «Долг мастерам всего»
          может быть больше, чем «К выплате» только за выбранный месяц.
        </p>
      </div>

      <div className="rounded border border-dashed bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        Пример: если в июле начислили 100 000 ₽, а выплатили 80 000 ₽, осталось
        долг 20 000 ₽. В августе начислили ещё 100 000 ₽ и выплатили 90 000 ₽, то
        «с прошлых периодов» будет 20 000 ₽, за август — 10 000 ₽, и общий долг
        30 000 ₽.
      </div>
    </div>
  );
}

function ExpenseView(p: Props) {
  const list = useMemo(
    () => [...p.expenses].sort((a, b) => b.spent_at.localeCompare(a.spent_at)),
    [p.expenses],
  );
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Итого прочих расходов
        </div>
        <div className="mt-1 text-3xl font-bold text-amber-600 tabular-nums">
          {fmt(p.otherExpenses)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {list.length} запис
          {list.length === 1 ? "ь" : list.length < 5 ? "и" : "ей"}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="rounded border border-dashed py-8 text-center text-sm text-muted-foreground">
          Расходов в этом периоде не было.
        </div>
      ) : (
        <div className="space-y-1.5">
          {list.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2.5 text-xs"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{e.title}</div>
                <div className="truncate text-muted-foreground">
                  {fmtDate(e.spent_at)}
                  {e.note ? ` · ${e.note}` : ""}
                </div>
              </div>
              <div className="text-right font-semibold text-amber-700 tabular-nums">
                − {fmt(Number(e.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            p.onClose();
            setTimeout(() => {
              document
                .getElementById("expenses-block")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          }}
        >
          Добавить или удалить расход
        </Button>
      </div>
    </div>
  );
}
