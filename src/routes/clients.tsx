import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Search, Car as CarIcon, Phone, Mail, User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createCar, createClient, deleteCar, deleteClient, listBrands, listCarModels,
  listCars, listClients, updateCar, updateClient,
} from "@/lib/api";
import type { Car, Client } from "@/lib/types";

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [clients, search]);

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
              <div>
                <h1 className="text-2xl font-bold">{selected.full_name}</h1>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditClient(selected)}>
                  <Pencil className="mr-1 h-4 w-4" />Изменить
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
          </div>
        )}
      </section>

      {/* CLIENT DIALOG */}
      <Dialog
        open={clientDialog.open}
        onOpenChange={(o) => setClientDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialog({ open: false, editing: null })}>
              Отмена
            </Button>
            <Button onClick={() => saveClientM.mutate()}>Сохранить</Button>
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
