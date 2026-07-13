import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

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
  createService, deleteService, deleteServicePrice, listBrands,
  listServicePrices, listServices, updateService, upsertServicePrice,
} from "@/lib/api";

export const Route = createFileRoute("/services")({
  ssr: false,
  component: ServicesPage,
});

function ServicesPage() {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [pricesOpen, setPricesOpen] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", category: "", base_price: 0, duration_minutes: 60 });

  const categories = useMemo(() => Array.from(new Set(services.map((s) => s.category))), [services]);

  const updM = useMutation({
    mutationFn: (v: { id: string; base_price?: number; duration_minutes?: number }) =>
      updateService(v.id, v),
    onSuccess: () => {
      toast.success("Обновлено");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
  const delM = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
  const createM = useMutation({
    mutationFn: () => createService(newForm),
    onSuccess: () => {
      toast.success("Добавлено");
      qc.invalidateQueries({ queryKey: ["services"] });
      setNewOpen(false);
      setNewForm({ name: "", category: "", base_price: 0, duration_minutes: 60 });
    },
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Услуги и цены</h1>
        <Button onClick={() => setNewOpen(true)}><Plus className="mr-2 h-4 w-4" />Добавить услугу</Button>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">{cat}</h2>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Услуга</TableHead>
                  <TableHead className="w-36">Базовая цена, ₽</TableHead>
                  <TableHead className="w-36">Длит., мин</TableHead>
                  <TableHead className="w-64"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.filter((s) => s.category === cat).map((s) => {
                  const price = prices[s.id] ?? s.base_price;
                  const dur = durations[s.id] ?? s.duration_minutes;
                  const changed = price !== s.base_price || dur !== s.duration_minutes;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrices({ ...prices, [s.id]: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={dur}
                          onChange={(e) => setDurations({ ...durations, [s.id]: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={!changed}
                          onClick={() => updM.mutate({ id: s.id, base_price: price, duration_minutes: dur })}
                        >
                          <Save className="mr-1 h-4 w-4" />Сохранить
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPricesOpen(s.id)}>
                          Цены по маркам
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { if (confirm(`Удалить услугу «${s.name}»?`)) delM.mutate(s.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Brand price overrides */}
      <BrandPricesDialog
        serviceId={pricesOpen}
        onClose={() => setPricesOpen(null)}
        brands={brands}
        baseService={services.find((s) => s.id === pricesOpen)}
      />

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новая услуга</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Категория</Label>
              <Input list="cats" value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })} />
              <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <Label>Название</Label>
              <Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Цена, ₽</Label>
                <Input type="number" value={newForm.base_price} onChange={(e) => setNewForm({ ...newForm, base_price: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Длит., мин</Label>
                <Input type="number" value={newForm.duration_minutes} onChange={(e) => setNewForm({ ...newForm, duration_minutes: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Отмена</Button>
            <Button
              onClick={() => {
                if (!newForm.name.trim() || !newForm.category.trim())
                  return toast.error("Заполните название и категорию");
                createM.mutate();
              }}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandPricesDialog({
  serviceId, onClose, brands, baseService,
}: {
  serviceId: string | null;
  onClose: () => void;
  brands: { id: string; name: string }[];
  baseService?: { id: string; name: string; base_price: number };
}) {
  const qc = useQueryClient();
  const { data: overrides = [] } = useQuery({
    queryKey: ["service_prices", serviceId],
    queryFn: () => listServicePrices(serviceId!),
    enabled: !!serviceId,
  });

  const [brandId, setBrandId] = useState("");
  const [price, setPrice] = useState<number>(0);

  const addM = useMutation({
    mutationFn: () => upsertServicePrice(serviceId!, brandId, price),
    onSuccess: () => {
      toast.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["service_prices", serviceId] });
      setBrandId(""); setPrice(0);
    },
  });
  const delM = useMutation({
    mutationFn: (bid: string) => deleteServicePrice(serviceId!, bid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_prices", serviceId] }),
  });

  return (
    <Dialog open={!!serviceId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Цены по маркам</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {baseService?.name} · базовая: {baseService?.base_price} ₽
        </div>
        <div className="mt-3 space-y-2 max-h-64 overflow-auto">
          {overrides.map((o) => {
            const b = brands.find((x) => x.id === o.brand_id);
            return (
              <div key={o.brand_id} className="flex items-center gap-2 rounded border p-2">
                <div className="flex-1 text-sm">{b?.name}</div>
                <div className="text-sm font-medium">{o.price} ₽</div>
                <Button size="icon" variant="ghost" onClick={() => delM.mutate(o.brand_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          {overrides.length === 0 && (
            <div className="text-sm text-muted-foreground">Переопределений нет</div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Марка" /></SelectTrigger>
            <SelectContent>
              {brands
                .filter((b) => !overrides.some((o) => o.brand_id === b.id))
                .map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            className="w-32"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="Цена"
          />
          <Button disabled={!brandId || !price} onClick={() => addM.mutate()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
