import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, Plus, X, ChevronsUpDown, Search, Check } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  addReminderInterval,
  createAppointment,
  createAppointmentPayment,
  createClientReminder,
  deleteAppointment,
  deleteAppointmentPayment,
  getAppointment,
  getPriceForBrand,
  listAppointmentPayments,
  listBrands,
  listCarModels,
  listCars,
  listClients,
  listMechanicServiceRates,
  listMechanics,
  listServices,
  updateAppointment,
  updateService,
  upsertServiceByCategoryName,
  humanizeSupabaseError,
} from "@/lib/api";

import { useCarCustomServices } from "@/hooks/useCarCustomServices";
import { useServiceUsage } from "@/hooks/useServiceUsage";

import { STATUS_LABELS, type AppointmentStatus, type ReminderInterval } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { effectivePayout, type PayoutMechanic, type PayoutService } from "@/lib/payouts";
import { useConfirm } from "@/components/ConfirmDialog";


type SvcRow = { service_id: string; price: number; mechanic_payout: number };

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

const mapError = humanizeSupabaseError;

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
  const confirmAction = useConfirm();
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
    if (override != null && override > 0) return Math.round(override);
    return effectivePayout({
      storedPayout: 0,
      price,
      mechanic: mechanics.find((m) => m.id === mechanicId) as PayoutMechanic,
      service: services.find((s) => s.id === svc_id) as PayoutService,
    });
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

  const selectedBrandName = useMemo(
    () => brands.find((b) => b.id === selectedCar?.brand_id)?.name ?? "",
    [brands, selectedCar],
  );
  const carCustom = useCarCustomServices(
    selectedBrandName,
    selectedCar?.model ?? "",
    selectedCar?.year ?? null,
  );
  const { bump } = useServiceUsage();

  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category))).sort(),
    [services],
  );

  const [customCat, setCustomCat] = useState<string>("");
  const [customCatOther, setCustomCatOther] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [savingCustom, setSavingCustom] = useState(false);

  // Live-поиск дублей при вводе своей услуги
  const customCatValue = customCat === "__other__" ? customCatOther : customCat;
  const duplicates = useMemo(() => {
    const name = norm(customName);
    if (name.length < 2) return { exact: null as null | typeof services[number], similar: [] as typeof services };
    const cat = norm(customCatValue);
    const exact = services.find(
      (s) => norm(s.name) === name && (cat ? norm(s.category) === cat : true),
    ) ?? null;
    const similar = services
      .filter((s) => s !== exact)
      .filter((s) => {
        const n = norm(s.name);
        return n.includes(name) || name.includes(n);
      })
      .slice(0, 5);
    return { exact, similar };
  }, [customName, customCatValue, services]);

  const addExistingToRecord = (svc: typeof services[number], overridePrice?: number) => {
    const price = overridePrice ?? svc.base_price;
    setSelected((prev) =>
      prev.some((s) => s.service_id === svc.id)
        ? prev
        : [...prev, { service_id: svc.id, price, mechanic_payout: rateFor(svc.id, price) }],
    );
  };

  const addCustomService = async (opts?: { force?: boolean; updatePriceOf?: string }) => {
    const cat = (customCat === "__other__" ? customCatOther : customCat).trim();
    const name = customName.trim();
    const price = Math.max(0, Math.round(Number(customPrice) || 0));
    if (!cat || !name || price <= 0) {
      toast.error("Заполните категорию, название и цену");
      return;
    }
    setSavingCustom(true);
    try {
      // 1) Обновить цену у существующей и добавить
      if (opts?.updatePriceOf) {
        const existingSvc = services.find((s) => s.id === opts.updatePriceOf);
        if (existingSvc) {
          await updateService(existingSvc.id, { base_price: price });
          qc.invalidateQueries({ queryKey: ["services"] });
          addExistingToRecord({ ...existingSvc, base_price: price }, price);
          if (carCustom.enabled) {
            try {
              await carCustom.add({
                category: existingSvc.category,
                name: existingSvc.name,
                price,
                duration_minutes: 30,
              });
            } catch (err) {
              console.warn("carCustom.add failed", err);
            }
          }
          setCustomName("");
          setCustomPrice("");
          toast.success("Цена обновлена, услуга добавлена");
          return;
        }
      }

      // 2) Автоматически подставить точный дубль, если пользователь не форсит создание
      if (!opts?.force && duplicates.exact) {
        addExistingToRecord(duplicates.exact);
        toast.message("Такая услуга уже есть — добавлена в запись", {
          description: `${duplicates.exact.category} — ${duplicates.exact.name}`,
        });
        setCustomName("");
        setCustomPrice("");
        return;
      }

      // 3) Создать новую (или переиспользовать при force, если совпадение по имени)
      const svc = await upsertServiceByCategoryName({ category: cat, name, price });
      if (carCustom.enabled) {
        try {
          await carCustom.add({ category: cat, name, price, duration_minutes: 30 });
        } catch (err) {
          console.warn("carCustom.add failed", err);
        }
      }
      qc.invalidateQueries({ queryKey: ["services"] });
      setSelected((prev) =>
        prev.some((s) => s.service_id === svc.id)
          ? prev
          : [...prev, { service_id: svc.id, price, mechanic_payout: rateFor(svc.id, price) }],
      );
      setCustomName("");
      setCustomPrice("");
      toast.success(
        carCustom.enabled
          ? "Услуга добавлена и запомнена для этой машины"
          : "Услуга добавлена",
      );
    } catch (e) {
      console.error("addCustomService failed", e);
      toast.error(mapError(e));
    } finally {
      setSavingCustom(false);
    }
  };

  const removeSavedCustom = async (id: string) => {
    const ok = await confirmAction({
      title: "Удалить сохранённую услугу?",
      description: "Услуга больше не будет предлагаться для этой машины.",
      destructive: true,
      confirmText: "Удалить",
    });
    if (!ok) return;
    try {
      await carCustom.remove(id);
    } catch (e) {
      console.error("removeSavedCustom failed", e);
      toast.error(mapError(e));
    }
  };

  const pickSavedCustom = async (id: string) => {
    const cs = carCustom.items.find((c) => c.id === id);
    if (!cs) return;
    try {
      const svc = await upsertServiceByCategoryName({
        category: cs.category,
        name: cs.name,
        price: cs.price,
      });
      qc.invalidateQueries({ queryKey: ["services"] });
      setSelected((prev) =>
        prev.some((s) => s.service_id === svc.id)
          ? prev
          : [
              ...prev,
              { service_id: svc.id, price: cs.price, mechanic_payout: rateFor(svc.id, cs.price) },
            ],
      );
    } catch (e) {
      console.error("pickSavedCustom failed", e);
      toast.error(mapError(e));
    }
  };

  // auto-set client when car chosen
  useEffect(() => {
    if (carId && !clientId) {
      const c = cars.find((x) => x.id === carId);
      if (c) setClientId(c.client_id);
    }
  }, [carId, clientId, cars]);

  // При смене мастера / загрузке ставок пересчитываем выплату.
  // Нулевые выплаты (префилл из калькулятора, старые записи без мастера,
  // только что добавленные без выбранного мастера) заполняем по проценту
  // (индивидуальный % мастера → % услуги → 50% по умолчанию).
  // Ненулевые (ручная правка) не трогаем при загрузке ставок; при смене
  // мастера пересчитываем всё, т.к. ставка другого мастера может отличаться.
  const prevMechIdRef = useRef<string>("");
  useEffect(() => {
    if (!mechanicId) return;
    const mechChanged = prevMechIdRef.current !== "" && prevMechIdRef.current !== mechanicId;
    prevMechIdRef.current = mechanicId;
    setSelected((prev) =>
      prev.map((s) =>
        mechChanged || !(s.mechanic_payout > 0)
          ? { ...s, mechanic_payout: rateFor(s.service_id, s.price) }
          : s,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mechanicId, rates, selected.length]);


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
      { service_id: svc.id, price, mechanic_payout: rateFor(svc.id, price) },
    ]);
    setAddServiceId("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!carId) throw new Error("Выберите машину");
      if (!startDate || !startTime) throw new Error("Укажите дату и время");
      const startsDate = new Date(`${startDate}T${startTime}:00`);
      const starts_at = startsDate.toISOString();

      // Страховка: если мастер выбран, а выплата у услуги 0 — считаем по %
      // (индивидуальный мастера/услуги, иначе 50%). Так в разделе «Механики»
      // корректно считаются оборот и зарплата, даже если пользователь не
      // трогал строку услуги вручную.
      const servicesPayload = selected.map((s) =>
        mechanicId && !(s.mechanic_payout > 0)
          ? { ...s, mechanic_payout: rateFor(s.service_id, s.price) }
          : s,
      );

      const payload = {
        car_id: carId,
        mechanic_id: mechanicId || null,
        starts_at,
        duration_minutes: duration,
        status,
        mileage: mileage ? Number(mileage) : null,
        comment: comment || null,
        services: servicesPayload,
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
      bump(selected.map((s) => s.service_id).filter(Boolean));
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
              <ServicePicker
                services={services.filter((s) => !selected.some((x) => x.service_id === s.id))}
                value={addServiceId}
                onChange={setAddServiceId}
              />
              <Button type="button" onClick={addService} disabled={!addServiceId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Сохранённые услуги для этой машины */}
            {carCustom.enabled && carCustom.items.length > 0 && (
              <div className="mt-3 rounded-md border bg-muted/30 p-2">
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Сохранённые для {selectedBrandName} {selectedCar?.model} · {selectedCar?.year}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {carCustom.items.map((c) => (
                    <div
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs"
                    >
                      <button
                        type="button"
                        className="hover:text-primary"
                        onClick={() => pickSavedCustom(c.id)}
                        title="Добавить в запись"
                      >
                        {c.category} — {c.name} · {c.price} ₽
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeSavedCustom(c.id)}
                        title="Удалить сохранённую"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ручное добавление услуги */}
            <div className="mt-3 rounded-md border border-dashed p-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Добавить свою услугу
                {!carCustom.enabled && " (без сохранения для машины — выберите машину с годом, чтобы запомнить)"}
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_auto]">
                <Select value={customCat} onValueChange={setCustomCat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="__other__">Другое…</SelectItem>
                  </SelectContent>
                </Select>
                {customCat === "__other__" ? (
                  <Input
                    placeholder="Новая категория"
                    value={customCatOther}
                    onChange={(e) => setCustomCatOther(e.target.value)}
                  />
                ) : (
                  <Input
                    placeholder="Название услуги"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                )}
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Цена ₽"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => addCustomService()}
                  disabled={savingCustom}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Добавить
                </Button>
              </div>
              {customCat === "__other__" && (
                <div className="mt-2">
                  <Input
                    placeholder="Название услуги"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
              )}

              {/* Точное совпадение */}
              {duplicates.exact && (
                <div className="mt-3 rounded-md border border-amber-400/60 bg-amber-50 p-2 text-xs dark:bg-amber-950/30">
                  <div className="mb-1.5 font-medium text-amber-900 dark:text-amber-200">
                    Такая услуга уже есть в справочнике
                  </div>
                  <div className="mb-2 text-muted-foreground">
                    {duplicates.exact.category} — {duplicates.exact.name} ·{" "}
                    {duplicates.exact.base_price} ₽
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={savingCustom}
                      onClick={() => {
                        addExistingToRecord(duplicates.exact!);
                        toast.success("Добавлено в запись");
                        setCustomName("");
                        setCustomPrice("");
                      }}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Добавить в запись
                    </Button>
                    {Number(customPrice) > 0 &&
                      Number(customPrice) !== duplicates.exact.base_price && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingCustom}
                          onClick={() =>
                            addCustomService({ updatePriceOf: duplicates.exact!.id })
                          }
                        >
                          Обновить цену на {Number(customPrice)} ₽ и добавить
                        </Button>
                      )}
                  </div>
                </div>
              )}

              {/* Похожие */}
              {!duplicates.exact && duplicates.similar.length > 0 && (
                <div className="mt-3 rounded-md border bg-muted/30 p-2 text-xs">
                  <div className="mb-1.5 flex items-center gap-1 font-medium text-muted-foreground">
                    <Search className="h-3.5 w-3.5" />
                    Похоже, есть уже такие:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {duplicates.similar.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 hover:border-primary hover:text-primary"
                        onClick={() => {
                          addExistingToRecord(s);
                          toast.success("Добавлено в запись");
                          setCustomName("");
                          setCustomPrice("");
                        }}
                      >
                        {s.category} — {s.name} · {s.base_price} ₽
                      </button>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    Не подходит? Тогда нажмите «Добавить» — создастся новая услуга.
                  </div>
                </div>
              )}
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
                                x.service_id === row.service_id
                                  ? { ...x, price: p, mechanic_payout: rateFor(x.service_id, p) }
                                  : x,
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

          {isEdit && appointmentId && (
            <PaymentsSection appointmentId={appointmentId} total={total} />
          )}



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

function ServicePicker({
  services,
  value,
  onChange,
}: {
  services: { id: string; category: string; name: string; base_price: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const grouped = useMemo(() => {
    const map = new Map<string, typeof services>();
    for (const s of services) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "ru"));
  }, [services]);
  const selected = services.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between font-normal"
        >
          <span className="truncate">
            {selected
              ? `${selected.category} — ${selected.name} · ${selected.base_price} ₽`
              : "Добавить услугу"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            if (!search) return 1;
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Поиск услуги…" />
          <CommandList className="max-h-72">
            <CommandEmpty>Ничего не найдено. Добавьте свою услугу ниже.</CommandEmpty>
            {grouped.map(([cat, items]) => (
              <CommandGroup key={cat} heading={cat}>
                {items.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`${s.category} ${s.name} ${s.base_price}`}
                    onSelect={() => {
                      onChange(s.id);
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {s.base_price} ₽
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PaymentsSection({
  appointmentId,
  total,
}: {
  appointmentId: string;
  total: number;
}) {
  const qc = useQueryClient();
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["appointment-payments", appointmentId],
    queryFn: () => listAppointmentPayments(appointmentId),
  });

  const paid = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const due = Math.max(0, total - paid);

  const [paidAt, setPaidAt] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["appointment-payments", appointmentId] });
    qc.invalidateQueries({ queryKey: ["appointment", appointmentId] });
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["payments-range"] });
  };

  const addMut = useMutation({
    mutationFn: () =>
      createAppointmentPayment({
        appointment_id: appointmentId,
        paid_at: paidAt,
        amount: Math.max(0, Math.round(Number(amount) || 0)),
        note: note.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      setAmount("");
      setNote("");
      toast.success("Платёж добавлен");
    },
    onError: (e: Error) => toast.error(mapError(e)),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAppointmentPayment(id),
    onSuccess: () => {
      invalidate();
      toast.success("Платёж удалён");
    },
    onError: (e: Error) => toast.error(mapError(e)),
  });

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-medium">Оплаты клиента</div>
        <div className="text-xs text-muted-foreground">
          Оплачено <span className="font-medium text-foreground">{paid} ₽</span> из {total} ₽ ·
          осталось <span className="font-medium text-foreground">{due} ₽</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Загрузка…</div>
      ) : payments.length === 0 ? (
        <div className="text-xs text-muted-foreground">Платежей пока нет.</div>
      ) : (
        <div className="space-y-1.5">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded border bg-background px-2 py-1.5 text-xs"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {format(new Date(p.paid_at), "d MMM yyyy")} · {Number(p.amount)} ₽
                </div>
                {p.note && <div className="truncate text-muted-foreground">{p.note}</div>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => delMut.mutate(p.id)}
                aria-label="Удалить платёж"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-[130px_minmax(0,1fr)_auto] items-end gap-2">
        <div>
          <Label className="text-xs">Дата</Label>
          <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Сумма, ₽</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={due > 0 ? String(due) : "0"}
          />
        </div>
        <Button
          type="button"
          onClick={() => addMut.mutate()}
          disabled={addMut.isPending || !amount || Number(amount) <= 0}
        >
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>
      <div className="mt-2">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Заметка (необязательно): наличными, перевод…"
        />
      </div>
      {due > 0 && (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setPaidAt(format(new Date(), "yyyy-MM-dd"));
              setAmount(String(due));
            }}
          >
            Заполнить остатком {due} ₽
          </Button>
        </div>
      )}
    </div>
  );
}

