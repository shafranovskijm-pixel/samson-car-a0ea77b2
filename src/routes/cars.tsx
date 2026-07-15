import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";

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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  createCar, deleteCar, listBrands, listCarModels, listCars, listClients, updateCar,
} from "@/lib/api";
import type { Car } from "@/lib/types";

export const Route = createFileRoute("/cars")({
  ssr: false,
  component: CarsPage,
});

const emptyForm = {
  client_id: "",
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

function CarsPage() {
  const qc = useQueryClient();
  const { data: cars = [] } = useQuery({ queryKey: ["cars"], queryFn: listCars });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [brandFilter, setBrandFilter] = useState("all");

  const filtered = useMemo(
    () => (brandFilter === "all" ? cars : cars.filter((c) => c.brand_id === brandFilter)),
    [cars, brandFilter],
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (c: Car) => {
    setEditing(c);
    setForm({
      client_id: c.client_id,
      brand_id: c.brand_id ?? "",
      model: c.model,
      year: c.year?.toString() ?? "",
      license_plate: c.license_plate ?? "",
      vin: c.vin ?? "",
      color: c.color ?? "",
      engine_volume: c.engine_volume?.toString() ?? "",
      engine_power: c.engine_power?.toString() ?? "",
      transmission: c.transmission ?? "",
      drive_type: c.drive_type ?? "",
      mileage: c.mileage?.toString() ?? "",
    });
    setOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.client_id) throw new Error("Выберите клиента");
      if (!form.model.trim()) throw new Error("Введите модель");
      const payload = {
        client_id: form.client_id,
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
      qc.invalidateQueries({ queryKey: ["cars"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteCar(id),
    onSuccess: () => {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["cars"] });
    },
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Машины</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Добавить</Button>
      </div>

      <div className="mb-3">
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все марки</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Марка / Модель</TableHead>
              <TableHead>Год</TableHead>
              <TableHead>Госномер</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>Пробег</TableHead>
              <TableHead>Владелец</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const b = brands.find((x) => x.id === c.brand_id);
              const cl = clients.find((x) => x.id === c.client_id);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {b?.name} {c.model}
                    {c.color ? <span className="text-muted-foreground"> · {c.color}</span> : null}
                  </TableCell>
                  <TableCell>{c.year ?? "—"}</TableCell>
                  <TableCell>{c.license_plate ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.vin ?? "—"}</TableCell>
                  <TableCell>{c.mileage != null ? `${c.mileage} км` : "—"}</TableCell>
                  <TableCell>{cl?.full_name ?? "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Удалить машину?")) delM.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Нет машин
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать машину" : "Новая машина"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Клиент</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
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
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={() => saveM.mutate()}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
