import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Search, Car as CarIcon, Phone, Mail, User,
  Bell, History as HistoryIcon, Check, Archive, ArchiveRestore,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createCar, createClient, createClientReminder, deleteCar, deleteClient,
  deleteClientReminder, listAppointmentsByClient, listBrands, listCarModels,
  listCars, listClientReminders, listClients, updateCar, updateClient,
  updateClientReminder,
} from "@/lib/api";
import type {
  Car, Client, ClientReminder, ReminderInterval,
} from "@/lib/types";
import { REMINDER_INTERVAL_LABELS, STATUS_LABELS } from "@/lib/types";


export const Route = createFileRoute("/clients")({
  ssr: false,
  component: ClientsPage,
});

function ClientsPage() {
  const qc = useQueryClient();
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const { data: cars = [] } = useQuery({ queryKey: ["cars"], queryFn: listCars });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");

  const [clientDialog, setClientDialog] = useState<{ open: boolean; editing: Client | null }>({
    open: false, editing: null,
  });
  const [clientForm, setClientForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    birthday: "",
    telegram: "",
    note: "",
  });
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);


  const [carDialog, setCarDialog] = useState<{ open: boolean; editing: Car | null; clientId: string }>({
    open: false, editing: null, clientId: "",
  });

  const activeCount = useMemo(() => clients.filter((c) => !c.is_archived).length, [clients]);
  const archivedCount = clients.length - activeCount;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byTab = clients.filter((c) =>
      tab === "archived" ? c.is_archived : !c.is_archived,
    );
    if (!q) return byTab;
    return byTab.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [clients, search, tab]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [selectedId, filtered]);

  const selected = clients.find((c) => c.id === selectedId) ?? null;
  const selectedCars = useMemo(
    () => (selected ? cars.filter((c) => c.client_id === selected.id) : []),
    [cars, selected],
  );

  const carsCountByClient = useMemo(() => {
    const m: Record<string, number> = {};
    cars.forEach((c) => { m[c.client_id] = (m[c.client_id] ?? 0) + 1; });
    return m;
  }, [cars]);

  const openNewClient = () => {
    setClientDialog({ open: true, editing: null });
    setClientForm({
      full_name: "",
      phone: "",
      email: "",
      address: "",
      birthday: "",
      telegram: "",
      note: "",
    });
    setCustomFields([]);
  };
  const openEditClient = (c: Client) => {
    setClientDialog({ open: true, editing: c });
    setClientForm({
      full_name: c.full_name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      birthday: c.birthday ?? "",
      telegram: c.telegram ?? "",
      note: c.note ?? "",
    });
    const cf = (c.custom_fields ?? {}) as Record<string, string>;
    setCustomFields(
      Object.entries(cf).map(([key, value]) => ({ key, value: String(value ?? "") })),
    );
  };

  const saveClientM = useMutation({
    mutationFn: async () => {
      const cf: Record<string, string> = {};
      customFields.forEach((f) => {
        const k = f.key.trim();
        if (k) cf[k] = f.value.trim();
      });
      const payload = {
        full_name: clientForm.full_name.trim(),
        phone: clientForm.phone.trim() || null,
        email: clientForm.email.trim() || null,
        address: clientForm.address.trim() || null,
        birthday: clientForm.birthday || null,
        telegram: clientForm.telegram.trim() || null,
        note: clientForm.note.trim() || null,
        custom_fields: cf,
      };
      if (!payload.full_name) throw new Error("Введите имя клиента");
      if (clientDialog.editing) {
        await updateClient(clientDialog.editing.id, payload);
        return clientDialog.editing.id;
      }
      const created = (await createClient(payload)) as unknown as { id: string };
      return created.id;
    },
    onSuccess: (id) => {
      toast.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setClientDialog({ open: false, editing: null });
      setSelectedId(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const delClientM = useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["cars"] });
      setSelectedId(null);
    },
  });

  const archiveM = useMutation({
    mutationFn: ({ id, is_archived }: { id: string; is_archived: boolean }) =>
      updateClient(id, { is_archived }),
    onSuccess: (_d, v) => {
      toast.success(v.is_archived ? "В архиве" : "Восстановлен");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setSelectedId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* LEFT: LIST */}
      <aside className="flex w-80 flex-col border-r bg-muted/30">
        <div className="border-b p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Клиенты</div>
            <Button size="sm" onClick={openNewClient}>
              <Plus className="mr-1 h-4 w-4" />Клиент
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, тел., email"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => { setTab("active"); setSelectedId(null); }}
              className={`rounded px-2 py-1 transition ${
                tab === "active" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
              }`}
            >
              Активные · {activeCount}
            </button>
            <button
              type="button"
              onClick={() => { setTab("archived"); setSelectedId(null); }}
              className={`rounded px-2 py-1 transition ${
                tab === "archived" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
              }`}
            >
              Архив · {archivedCount}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {clients.length === 0 ? "Пока нет клиентов" : "Ничего не найдено"}
            </div>
          )}
          {filtered.map((c) => {
            const active = c.id === selectedId;
            const cnt = carsCountByClient[c.id] ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center gap-3 border-b px-3 py-2.5 text-left text-sm transition ${
                  active ? "bg-primary/10" : "hover:bg-muted/60"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-xs font-bold text-white">
                  {c.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.phone ?? c.email ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CarIcon className="h-3 w-3" />
                  {cnt}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT: DETAIL */}
      <section className="flex-1 overflow-auto p-6">
        {!selected ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <User className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <div>Выберите клиента слева или добавьте нового</div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            {/* HEADER */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">{selected.full_name}</h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {selected.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {selected.phone}
                    </span>
                  )}
                  {selected.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selected.email}
                    </span>
                  )}
                  {selected.telegram && (
                    <span className="inline-flex items-center gap-1">TG: {selected.telegram}</span>
                  )}
                  {selected.birthday && (
                    <span className="inline-flex items-center gap-1">
                      ДР: {new Date(selected.birthday).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                  {selected.address && (
                    <span className="inline-flex items-center gap-1">Адрес: {selected.address}</span>
                  )}
                </div>
                {selected.note && (
                  <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm text-foreground">
                    {selected.note}
                  </div>
                )}
                {selected.custom_fields &&
                  Object.keys(selected.custom_fields as Record<string, string>).length > 0 && (
                    <div className="mt-3 grid gap-1 text-sm">
                      {Object.entries(selected.custom_fields as Record<string, string>).map(
                        ([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-muted-foreground">{k}:</span>
                            <span className="text-foreground">{String(v)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditClient(selected)}>
                  <Pencil className="mr-1 h-4 w-4" />Изменить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    archiveM.mutate({ id: selected.id, is_archived: !selected.is_archived })
                  }
                >
                  {selected.is_archived ? (
                    <><ArchiveRestore className="mr-1 h-4 w-4" />Восстановить</>
                  ) : (
                    <><Archive className="mr-1 h-4 w-4" />В архив</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Удалить клиента «${selected.full_name}» и все его машины?`)) {
                      delClientM.mutate(selected.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* CARS */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Автомобили <span className="text-sm font-normal text-muted-foreground">· {selectedCars.length}</span>
              </h2>
              <Button
                size="sm"
                onClick={() =>
                  setCarDialog({ open: true, editing: null, clientId: selected.id })
                }
              >
                <Plus className="mr-1 h-4 w-4" />Добавить машину
              </Button>
            </div>

            {selectedCars.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                У клиента ещё нет машин
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedCars.map((car) => {
                  const brand = brands.find((b) => b.id === car.brand_id);
                  return (
                    <div key={car.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold">
                            {brand?.name ?? "—"} {car.model}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {[car.year, car.color].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setCarDialog({ open: true, editing: car, clientId: selected.id })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Удалить машину?")) {
                                deleteCar(car.id).then(() => {
                                  toast.success("Удалено");
                                  qc.invalidateQueries({ queryKey: ["cars"] });
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Госномер: <span className="text-foreground">{car.license_plate ?? "—"}</span></div>
                        <div>Пробег: <span className="text-foreground">{car.mileage != null ? `${car.mileage} км` : "—"}</span></div>
                        <div>VIN: <span className="font-mono text-foreground">{car.vin ?? "—"}</span></div>
                        <div>КПП: <span className="text-foreground">{car.transmission ?? "—"}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* HISTORY */}
            <ClientHistory clientId={selected.id} />

            {/* REMINDERS */}
            <ClientReminders clientId={selected.id} />
          </div>
        )}
      </section>


      {/* CLIENT DIALOG */}
      <Dialog
        open={clientDialog.open}
        onOpenChange={(o) => setClientDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{clientDialog.editing ? "Редактировать клиента" : "Новый клиент"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>ФИО</Label>
              <Input
                value={clientForm.full_name}
                onChange={(e) => setClientForm({ ...clientForm, full_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Телефон</Label>
                <Input
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telegram</Label>
                <Input
                  value={clientForm.telegram}
                  onChange={(e) => setClientForm({ ...clientForm, telegram: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div>
                <Label>Дата рождения</Label>
                <Input
                  type="date"
                  value={clientForm.birthday}
                  onChange={(e) => setClientForm({ ...clientForm, birthday: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Адрес</Label>
              <Input
                value={clientForm.address}
                onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Заметка</Label>
              <Input
                value={clientForm.note}
                onChange={(e) => setClientForm({ ...clientForm, note: e.target.value })}
              />
            </div>

            <div className="mt-2 rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="m-0">Свои поля</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCustomFields((prev) => [...prev, { key: "", value: "" }])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Добавить поле
                </Button>
              </div>
              {customFields.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Например: скидка, соцсеть, реферер
                </div>
              )}
              <div className="grid gap-2">
                {customFields.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Название"
                      value={f.key}
                      maxLength={50}
                      onChange={(e) =>
                        setCustomFields((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)),
                        )
                      }
                    />
                    <Input
                      placeholder="Значение"
                      value={f.value}
                      maxLength={500}
                      onChange={(e) =>
                        setCustomFields((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                        )
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setCustomFields((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialog({ open: false, editing: null })}>
              Отмена
            </Button>
            <Button onClick={() => saveClientM.mutate()} disabled={saveClientM.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>

      {/* CAR DIALOG */}
      <CarDialog
        open={carDialog.open}
        editing={carDialog.editing}
        clientId={carDialog.clientId}
        brands={brands}
        onClose={() => setCarDialog({ open: false, editing: null, clientId: "" })}
        onSaved={() => qc.invalidateQueries({ queryKey: ["cars"] })}
      />
    </div>
  );
}

const emptyCarForm = {
  brand_id: "",
  model: "",
  year: "",
  license_plate: "",
  vin: "",
  color: "",
  engine_volume: "",
  engine_power: "",
  transmission: "",
  drive_type: "",
  mileage: "",
};

function CarDialog({
  open, editing, clientId, brands, onClose, onSaved,
}: {
  open: boolean;
  editing: Car | null;
  clientId: string;
  brands: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(emptyCarForm);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        brand_id: editing.brand_id ?? "",
        model: editing.model,
        year: editing.year?.toString() ?? "",
        license_plate: editing.license_plate ?? "",
        vin: editing.vin ?? "",
        color: editing.color ?? "",
        engine_volume: editing.engine_volume?.toString() ?? "",
        engine_power: editing.engine_power?.toString() ?? "",
        transmission: editing.transmission ?? "",
        drive_type: editing.drive_type ?? "",
        mileage: editing.mileage?.toString() ?? "",
      });
    } else {
      setForm(emptyCarForm);
    }
  }, [open, editing]);

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.model.trim()) throw new Error("Введите модель");
      const payload = {
        client_id: clientId,
        brand_id: form.brand_id || null,
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        license_plate: form.license_plate.trim() || null,
        vin: form.vin.trim() || null,
        color: form.color.trim() || null,
        engine_volume: form.engine_volume ? Number(form.engine_volume) : null,
        engine_power: form.engine_power ? Number(form.engine_power) : null,
        transmission: form.transmission || null,
        drive_type: form.drive_type || null,
        mileage: form.mileage ? Number(form.mileage) : null,
      };
      if (editing) await updateCar(editing.id, payload);
      else await createCar(payload);
    },
    onSuccess: () => {
      toast.success("Сохранено");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Редактировать машину" : "Новая машина"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Марка</Label>
            <Select value={form.brand_id} onValueChange={(v) => setForm({ ...form, brand_id: v })}>
              <SelectTrigger><SelectValue placeholder="Марка" /></SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Модель</Label>
            <Input
              list={form.brand_id ? `models-${form.brand_id}` : undefined}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder={form.brand_id ? "Начните вводить или выберите" : "Сначала выберите марку"}
            />
            {form.brand_id && <ModelsDatalist brandId={form.brand_id} />}
          </div>
          <div>
            <Label>Год</Label>
            <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </div>
          <div>
            <Label>Госномер</Label>
            <Input value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>VIN</Label>
            <Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
          </div>
          <div>
            <Label>Цвет</Label>
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div>
            <Label>Пробег, км</Label>
            <Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
          </div>
          <div>
            <Label>Объём двигателя, л</Label>
            <Input type="number" step="0.1" value={form.engine_volume} onChange={(e) => setForm({ ...form, engine_volume: e.target.value })} />
          </div>
          <div>
            <Label>Мощность, л.с.</Label>
            <Input type="number" value={form.engine_power} onChange={(e) => setForm({ ...form, engine_power: e.target.value })} />
          </div>
          <div>
            <Label>Тип КПП</Label>
            <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="МКПП">МКПП</SelectItem>
                <SelectItem value="АКПП">АКПП</SelectItem>
                <SelectItem value="Вариатор">Вариатор</SelectItem>
                <SelectItem value="Робот">Робот</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Привод</Label>
            <Select value={form.drive_type} onValueChange={(v) => setForm({ ...form, drive_type: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Передний">Передний</SelectItem>
                <SelectItem value="Задний">Задний</SelectItem>
                <SelectItem value="Полный">Полный</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => saveM.mutate()}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModelsDatalist({ brandId }: { brandId: string }) {
  const { data: models = [] } = useQuery({
    queryKey: ["car-models", brandId],
    queryFn: () => listCarModels(brandId),
  });
  return (
    <datalist id={`models-${brandId}`}>
      {models.map((m) => (
        <option key={m.id} value={m.name} />
      ))}
    </datalist>
  );
}

// ============ HISTORY ============
function ClientHistory({ clientId }: { clientId: string }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["client-history", clientId],
    queryFn: () => listAppointmentsByClient(clientId),
  });
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((a) => {
      const dateStr = new Date(a.starts_at).toLocaleString("ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const parts = [
        dateStr,
        a.car?.brand?.name ?? "",
        a.car?.model ?? "",
        a.car?.license_plate ?? "",
        a.comment ?? "",
        STATUS_LABELS[a.status] ?? a.status,
        ...a.services.map((sv) => sv.service?.name ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return parts.includes(s);
    });
  }, [items, q]);

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            История{" "}
            <span className="text-sm font-normal text-muted-foreground">
              · {filtered.length}
              {q && items.length !== filtered.length ? ` из ${items.length}` : ""}
            </span>
          </h2>
        </div>
        {items.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по услугам, авто, дате…"
              className="h-9 pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          {items.length === 0 ? "Записей пока нет" : "Ничего не найдено"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const brand = a.car?.brand?.name ?? "";
            const model = a.car?.model ?? "";
            const plate = a.car?.license_plate ? ` · ${a.car.license_plate}` : "";
            return (
              <div key={a.id} className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {new Date(a.starts_at).toLocaleString("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {brand} {model}{plate}
                    </div>
                    {a.services.length > 0 && (
                      <div className="mt-1 text-xs">
                        {a.services
                          .map((s) => s.service?.name ?? "—")
                          .join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold">{a.total_price} ₽</div>
                    <div className="text-xs text-muted-foreground">
                      {STATUS_LABELS[a.status] ?? a.status}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ REMINDERS ============
const INTERVAL_MS: Record<Exclude<ReminderInterval, "custom">, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  half_year: 182 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

function computeRemindAt(kind: ReminderInterval, customDate: string): string {
  if (kind === "custom") {
    if (!customDate) throw new Error("Выберите дату напоминания");
    return new Date(customDate).toISOString();
  }
  return new Date(Date.now() + INTERVAL_MS[kind]).toISOString();
}

function ClientReminders({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["client-reminders", clientId],
    queryFn: () => listClientReminders(clientId),
  });

  const [dialog, setDialog] = useState<{ open: boolean; editing: ClientReminder | null }>({
    open: false, editing: null,
  });
  const [form, setForm] = useState({
    title: "",
    note: "",
    interval_kind: "week" as ReminderInterval,
    custom_date: "",
    repeat: false,
  });

  const openNew = () => {
    setDialog({ open: true, editing: null });
    setForm({ title: "", note: "", interval_kind: "week", custom_date: "", repeat: false });
  };
  const openEdit = (r: ClientReminder) => {
    setDialog({ open: true, editing: r });
    setForm({
      title: r.title,
      note: r.note ?? "",
      interval_kind: r.interval_kind,
      custom_date: r.interval_kind === "custom"
        ? new Date(r.remind_at).toISOString().slice(0, 16)
        : "",
      repeat: r.repeat,
    });
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["client-reminders", clientId] });

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Введите название");
      const remind_at = computeRemindAt(form.interval_kind, form.custom_date);
      const payload = {
        client_id: clientId,
        title: form.title.trim(),
        note: form.note.trim() || null,
        remind_at,
        interval_kind: form.interval_kind,
        repeat: form.repeat,
      };
      if (dialog.editing) await updateClientReminder(dialog.editing.id, payload);
      else await createClientReminder(payload);
    },
    onSuccess: () => {
      toast.success("Сохранено");
      invalidate();
      setDialog({ open: false, editing: null });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDoneM = useMutation({
    mutationFn: async (r: ClientReminder) => {
      if (r.done_at) {
        await updateClientReminder(r.id, { done_at: null });
        return;
      }
      if (r.repeat && r.interval_kind !== "custom") {
        const next = new Date(Date.now() + INTERVAL_MS[r.interval_kind]).toISOString();
        await updateClientReminder(r.id, { remind_at: next, done_at: null });
      } else {
        await updateClientReminder(r.id, { done_at: new Date().toISOString() });
      }
    },
    onSuccess: invalidate,
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteClientReminder(id),
    onSuccess: () => { toast.success("Удалено"); invalidate(); },
  });

  const now = Date.now();

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            Напоминания{" "}
            <span className="text-sm font-normal text-muted-foreground">· {items.length}</span>
          </h2>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" />Напоминание
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Напоминаний пока нет
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const ts = new Date(r.remind_at).getTime();
            const overdue = !r.done_at && ts < now;
            const soon = !r.done_at && ts >= now && ts - now < 3 * 24 * 60 * 60 * 1000;
            const cls = r.done_at
              ? "opacity-60"
              : overdue
                ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                : soon
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                  : "";
            return (
              <div key={r.id} className={`rounded-lg border bg-card p-3 text-sm ${cls}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`font-medium ${r.done_at ? "line-through" : ""}`}>
                      {r.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.remind_at).toLocaleString("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {" · "}
                      {REMINDER_INTERVAL_LABELS[r.interval_kind]}
                      {r.repeat ? " · повтор" : ""}
                    </div>
                    {r.note && <div className="mt-1 text-xs">{r.note}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title={r.done_at ? "Вернуть" : "Выполнено"}
                      onClick={() => toggleDoneM.mutate(r)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { if (confirm("Удалить напоминание?")) delM.mutate(r.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.editing ? "Редактировать напоминание" : "Новое напоминание"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Название</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: ТО, замена масла, позвонить"
              />
            </div>
            <div>
              <Label>Комментарий</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Когда напомнить</Label>
              <Select
                value={form.interval_kind}
                onValueChange={(v) => setForm({ ...form, interval_kind: v as ReminderInterval })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Через день</SelectItem>
                  <SelectItem value="week">Через неделю</SelectItem>
                  <SelectItem value="month">Через месяц</SelectItem>
                  <SelectItem value="half_year">Через полгода</SelectItem>
                  <SelectItem value="year">Через год</SelectItem>
                  <SelectItem value="custom">Произвольная дата</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.interval_kind === "custom" && (
              <div>
                <Label>Дата и время</Label>
                <Input
                  type="datetime-local"
                  value={form.custom_date}
                  onChange={(e) => setForm({ ...form, custom_date: e.target.value })}
                />
              </div>
            )}
            {form.interval_kind !== "custom" && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.repeat}
                  onCheckedChange={(v) => setForm({ ...form, repeat: v === true })}
                />
                Повторять каждый {REMINDER_INTERVAL_LABELS[form.interval_kind].toLowerCase()}
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>
              Отмена
            </Button>
            <Button onClick={() => saveM.mutate()} disabled={saveM.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
