import { useState } from "react";
import type { AppointmentWithRelations, AppointmentPayment } from "@/lib/api";
import { reconcilePayments } from "@/lib/paymentReconciliation";
import { ussDateISO } from "@/lib/tz";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const rub = (n: number) => n.toLocaleString("ru-RU") + " ₽";
const date = (v: string) => v.split("-").reverse().join(".");

export function PaymentReconciliation({ works, payments, from, to, loading }: {
  works: AppointmentWithRelations[]; payments: AppointmentPayment[]; from: string; to: string; loading: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const result = reconcilePayments(works, payments, from, to);
  const selectedWork = works.find((a) => a.id === selected);
  return (
    <section className="mb-6 border-y py-4" aria-label="Сверка поступлений и записей">
      <h2 className="font-semibold">Почему поступления отличаются от суммы работ?</h2>
      {loading ? <p className="mt-2 text-sm text-muted-foreground">Загружаем сверку…</p> : <>
        <p className="mt-1 text-sm text-muted-foreground">{date(from)} — {date(to)}. Работы — по дате записи, поступления — по дате оплаты. Фильтры мастера, статуса и оплаты в списке записей также меняют его сумму.</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-2"><dt>Сумма работ периода</dt><dd className="font-semibold tabular-nums">{rub(result.workTotal)}</dd></div>
          <div className="flex justify-between gap-2"><dt>Поступило за работы периода</dt><dd className="font-semibold tabular-nums">{rub(result.matching)}</dd></div>
          <div className="flex justify-between gap-2"><dt>Не оплачено за работы периода</dt><dd className="font-semibold tabular-nums text-destructive">{rub(result.unpaid)}</dd></div>
          <div className="flex justify-between gap-2"><dt>За работы периода оплачено в другие даты</dt><dd className="font-semibold tabular-nums">{rub(result.outsideDates)}</dd></div>
          <div className="flex justify-between gap-2"><dt>Поступило за другие / отменённые работы</dt><dd className="font-semibold tabular-nums text-primary">{rub(result.other)}</dd></div>
          <div className="flex justify-between gap-2"><dt>Всего поступило, как в кассе</dt><dd className="font-semibold tabular-nums">{rub(result.receipts)}</dd></div>
        </dl>
        <p className="mt-3 text-sm font-medium">{result.difference > 0 ? `Поступления больше суммы работ на ${rub(result.difference)}.` : result.difference < 0 ? `Поступления меньше суммы работ на ${rub(-result.difference)}.` : "Поступления и сумма работ совпадают."}</p>
        <p className="mt-1 text-xs text-muted-foreground">{rub(result.workTotal)} − {rub(result.unpaid)} − {rub(result.outsideDates)} + {rub(result.other)} = {rub(result.receipts)}. Остаток кассы дополнительно уменьшается на выплаты мастерам и расходы.</p>
        {result.otherPayments.length > 0 && <div className="mt-3 divide-y">
          {result.otherPayments.map((p) => {
            const a = works.find((w) => w.id === p.appointment_id);
            return <Button key={p.id} variant="ghost" className="h-auto w-full justify-between gap-3 whitespace-normal px-0 py-3 text-left" onClick={() => setSelected(p.appointment_id)}>
              <span className="min-w-0"><span className="block">{a?.car?.client?.full_name ?? "Работа"} · {a?.car?.brand?.name} {a?.car?.model}</span><span className="block text-xs text-muted-foreground">Работа: {a ? date(ussDateISO(new Date(a.starts_at))) : "дата недоступна"}{a?.status === "cancelled" ? " · отменена" : ""} · Оплата: {date(p.paid_at)}</span></span>
              <span className="shrink-0 tabular-nums">{rub(Number(p.amount))}</span>
            </Button>;
          })}
        </div>}
      </>}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Расшифровка оплаты</DialogTitle></DialogHeader>
          {selectedWork && <div className="space-y-3 text-sm">
            <p className="font-semibold">{selectedWork.car?.client?.full_name} · {selectedWork.car?.brand?.name} {selectedWork.car?.model}</p>
            <p>Дата работы: {date(ussDateISO(new Date(selectedWork.starts_at)))} · Мастер: {selectedWork.mechanic?.full_name ?? "Не назначен"}</p>
            <div className="divide-y">{selectedWork.services.map((s, i) => <div key={`${s.service_id}-${i}`} className="flex justify-between gap-3 py-2"><span>{s.service?.name ?? "Услуга"}</span><span className="shrink-0 tabular-nums">{rub(Number(s.price))}</span></div>)}</div>
            <p>Стоимость работы: {rub(Number(selectedWork.total_price ?? 0))}</p>
            <h3 className="font-semibold">Оплаты в выбранном периоде</h3>
            {payments.filter((p) => p.appointment_id === selected).map((p) => <div key={p.id} className="flex justify-between gap-3"><span>{date(p.paid_at)}{p.note ? ` · ${p.note}` : ""}</span><span className="shrink-0 tabular-nums">{rub(Number(p.amount))}</span></div>)}
          </div>}
        </DialogContent>
      </Dialog>
    </section>
  );
}