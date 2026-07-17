import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  addReminderInterval,
  createAppointment,
  createClientReminder,
  deleteAppointment,
  getAppointment,
  getPriceForBrand,
  listBrands,
  listCarModels,
  listCars,
  listClients,
  listMechanicServiceRates,
  listMechanics,
  listServices,
  updateAppointment,
} from "@/lib/api";

import { STATUS_LABELS, type AppointmentStatus, type ReminderInterval } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

type SvcRow = { service_id: string; price: number; mechanic_payout: number };

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointmentId?: string | null;
  defaultStart?: Date | null;
  defaultCarId?: string | null;
  defaultServices?: { service_id: string; price: number }[];
  defaultBrandId?: string | null;
  defaultModelId?: string | null;
};


export function AppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  defaultStart,
  defaultCarId,
  defaultServices,
  defaultBrandId,
  defaultModelId,
}: Props) {

  const qc = useQueryClient();
  const isEdit = !!appointmentId;

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const { data: cars = [] } = useQuery({ queryKey: ["cars"], queryFn: listCars });
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const { data: allModels = [] } = useQuery({
    queryKey: ["car-models"],
    queryFn: () => listCarModels(),
  });
  const { data: existing } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => getAppointment(appointmentId!),
    enabled: !!appointmentId && open,
  });

  const prefillLabel = useMemo(() => {
    if (!defaultBrandId && !defaultModelId) return "";
    const b = brands.find((x) => x.id === defaultBrandId)?.name ?? "";
    const m = allModels.find((x) => x.id === defaultModelId)?.name ?? "";
    return [b, m].filter(Boolean).join(" ");
  }, [brands, allModels, defaultBrandId, defaultModelId]);


  const [clientId, setClientId] = useState<string>("");
  const [carId, setCarId] = useState<string>("");
  const [mechanicId, setMechanicId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [mileage, setMileage] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [selected, setSelected] = useState<SvcRow[]>([]);
  const [addServiceId, setAddServiceId] = useState<string>("");
  const [reminderOn, setReminderOn] = useState<boolean>(false);
  const [reminderInterval, setReminderInterval] = useState<ReminderInterval>("half_year");
  const [reminderTitle, setReminderTitle] = useState<string>("");

  const { data: rates = [] } = useQuery({
    queryKey: ["mechanic-service-rates", mechanicId],
    queryFn: () => listMechanicServiceRates(mechanicId),
    enabled: !!mechanicId,
  });
  const rateFor = (svc_id: string, price: number) => {
    const override = rates.find((r) => r.service_id === svc_id)?.amount;
    if (override != null && override > 0) return override;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = services.find((s) => s.id === svc_id) as any;
    const pct = Number(svc?.default_payout_percent ?? 50);
    return Math.round((price * pct) / 100);
  };


  useEffect(() => {
    if (!open) return;
    if (existing) {
      setClientId(existing.car?.client_id ?? "");
      setCarId(existing.car_id);
      setMechanicId(existing.mechanic_id ?? "");
      const d = new Date(existing.starts_at);
      setStartDate(format(d, "yyyy-MM-dd"));
      setStartTime(format(d, "HH:mm"));
      setDuration(existing.duration_minutes);
      setStatus(existing.status as AppointmentStatus);
      setMileage(existing.mileage?.toString() ?? "");
      setComment(existing.comment ?? "");
      setSelected(existing.services.map((s) => ({ service_id: s.service_id, price: s.price, mechanic_payout: s.mechanic_payout ?? 0 })));
    } else {
      const d = defaultStart ?? new Date();
      // try to auto-select a car matching prefilled brand/model
      let autoCarId = defaultCarId ?? "";
      let autoClientId = "";
      if (!autoCarId && (defaultBrandId || defaultModelId)) {
        const modelName = allModels.find((m) => m.id === defaultModelId)?.name;
        const match = cars.find(
          (c) =>
            (!defaultBrandId || c.brand_id === defaultBrandId) &&
            (!modelName || c.model?.toLowerCase() === modelName.toLowerCase()),
        );
        if (match) {
          autoCarId = match.id;
          autoClientId = match.client_id;
        }
      }
      setClientId(autoClientId);
      setCarId(autoCarId);
      setMechanicId("");
      setStartDate(format(d, "yyyy-MM-dd"));
      setStartTime(format(d, "HH:mm"));
      setDuration(60);
      setStatus("scheduled");
      setMileage("");
      setComment(prefillLabel ? `Из калькулятора: ${prefillLabel}` : "");
      setSelected(
        defaultServices && defaultServices.length > 0
          ? defaultServices.map((s) => ({ ...s, mechanic_payout: 0 }))
          : [],
      );
    }
    setAddServiceId("");
    setReminderOn(false);
    setReminderInterval("half_year");
    setReminderTitle("");
  }, [
    open,
    existing,
    defaultStart,
    defaultCarId,
    defaultServices,
    defaultBrandId,
    defaultModelId,
    prefillLabel,
    allModels,
    cars,
  ]);


  // filter cars by chosen client
  const carsForClient = useMemo(
    () => (clientId ? cars.filter((c) => c.client_id === clientId) : cars),
    [cars, clientId],
  );
  const selectedCar = useMemo(() => cars.find((c) => c.id === carId), [cars, carId]);

  // auto-set client when car chosen
  useEffect(() => {
    if (carId && !clientId) {
      const c = cars.find((x) => x.id === carId);
      if (c) setClientId(c.client_id);
    }
  }, [carId, clientId, cars]);

  // when mechanic changes, refill mechanic_payout from rates for services with 0 payout
  useEffect(() => {
    if (!mechanicId || rates.length === 0) return;
    setSelected((prev) =>
      prev.map((s) =>
        s.mechanic_payout === 0
          ? { ...s, mechanic_payout: rates.find((r) => r.service_id === s.service_id)?.amount ?? 0 }
          : s,
      ),
    );
  }, [mechanicId, rates]);


  const total = selected.reduce((s, x) => s + (x.price || 0), 0);

  const addService = async () => {
    if (!addServiceId) return;
    if (selected.some((s) => s.service_id === addServiceId)) return;
    const svc = services.find((s) => s.id === addServiceId);
    if (!svc) return;
    let price = svc.base_price;
    if (selectedCar?.brand_id) {
      const override = await getPriceForBrand(svc.id, selectedCar.brand_id);
      if (override != null) price = override;
    }
    setSelected((prev) => [
      ...prev,
      { service_id: svc.id, price, mechanic_payout: rateFor(svc.id) },
    ]);
    setAddServiceId("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!carId) throw new Error("Выберите машину");
      if (!startDate || !startTime) throw new Error("Укажите дату и время");
      const startsDate = new Date(`${startDate}T${startTime}:00`);
      const starts_at = startsDate.toISOString();

      const payload = {
        car_id: carId,
        mechanic_id: mechanicId || null,
        starts_at,
        duration_minutes: duration,
        status,
        mileage: mileage ? Number(mileage) : null,
        comment: comment || null,
        services: selected,
      };
      if (isEdit) await updateAppointment(appointmentId!, payload);
      else await createAppointment(payload);

      // Автосоздание напоминания
      if (reminderOn && clientId && reminderInterval !== "custom") {
        const remindAt = addReminderInterval(
          startsDate,
          reminderInterval as "day" | "week" | "month" | "half_year" | "year",
        );
        const client = clients.find((c) => c.id === clientId);
        const svcNames = selected
          .map((s) => services.find((sv) => sv.id === s.service_id)?.name)
          .filter(Boolean)
          .join(", ");
        const title =
          reminderTitle.trim() ||
          `Напоминание${svcNames ? ` (${svcNames})` : ""}${client ? ` — ${client.full_name}` : ""}`;
        await createClientReminder({
          client_id: clientId,
          title,
          note: null,
          remind_at: remindAt.toISOString(),
          interval_kind: reminderInterval,
          repeat: false,
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Запись обновлена" : "Запись создана");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["client-reminders"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: () => deleteAppointment(appointmentId!),
    onSuccess: () => {
      toast.success("Запись удалена");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать запись" : "Новая запись"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Клиент</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                <SelectContent>
                  {clients.filter((c) => !c.is_archived).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}{c.phone ? ` · ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Машина</Label>
              <Select value={carId} onValueChange={setCarId}>
                <SelectTrigger><SelectValue placeholder="Выберите машину" /></SelectTrigger>
                <SelectContent>
                  {carsForClient.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.model}{c.license_plate ? ` · ${c.license_plate}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <Label>Дата</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Время</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Длит. (мин)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Мастер</Label>
              <Select value={mechanicId} onValueChange={setMechanicId}>
                <SelectTrigger><SelectValue placeholder="Не назначен" /></SelectTrigger>
                <SelectContent>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Пробег на момент визита</Label>
            <Input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="км"
            />
          </div>

          <div>
            <Label>Услуги</Label>
            <div className="mt-2 flex gap-2">
              <Select value={addServiceId} onValueChange={setAddServiceId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Добавить услугу" /></SelectTrigger>
                <SelectContent>
                  {services
                    .filter((s) => !selected.some((x) => x.service_id === s.id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.category} — {s.name} · {s.base_price} ₽
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addService} disabled={!addServiceId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {selected.length === 0 && (
                <div className="text-sm text-muted-foreground">Нет добавленных услуг</div>
              )}
              {selected.map((row) => {
                const svc = services.find((s) => s.id === row.service_id);
                return (
                  <div key={row.service_id} className="rounded border p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{svc?.name}</div>
                        <div className="text-xs text-muted-foreground">{svc?.category}</div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        onClick={() =>
                          setSelected((prev) => prev.filter((x) => x.service_id !== row.service_id))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Клиенту:</span>
                        <Input
                          type="number"
                          className="h-8 w-24"
                          value={row.price}
                          onChange={(e) => {
                            const p = Number(e.target.value);
                            setSelected((prev) =>
                              prev.map((x) =>
                                x.service_id === row.service_id ? { ...x, price: p } : x,
                              ),
                            );
                          }}
                        />
                        <span>₽</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Мастеру:</span>
                        <Input
                          type="number"
                          className="h-8 w-24"
                          value={row.mechanic_payout}
                          disabled={!mechanicId}
                          onChange={(e) => {
                            const p = Number(e.target.value);
                            setSelected((prev) =>
                              prev.map((x) =>
                                x.service_id === row.service_id
                                  ? { ...x, mechanic_payout: p }
                                  : x,
                              ),
                            );
                          }}
                        />
                        <span>₽</span>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
            <div className="mt-3 flex justify-end">
              <Badge variant="secondary" className="text-base">Итого: {total} ₽</Badge>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="reminder-on"
                checked={reminderOn}
                onCheckedChange={(v) => setReminderOn(!!v)}
              />
              <Label htmlFor="reminder-on" className="cursor-pointer">
                Создать напоминание клиенту после визита
              </Label>
            </div>
            {reminderOn && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Через</Label>
                  <Select
                    value={reminderInterval}
                    onValueChange={(v) => setReminderInterval(v as ReminderInterval)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">День</SelectItem>
                      <SelectItem value="week">Неделю</SelectItem>
                      <SelectItem value="month">Месяц</SelectItem>
                      <SelectItem value="half_year">Полгода</SelectItem>
                      <SelectItem value="year">Год</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Название (необязательно)</Label>
                  <Input
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="Авто: услуги + клиент"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Комментарий</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirm("Удалить запись?")) delMutation.mutate();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Удалить
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
