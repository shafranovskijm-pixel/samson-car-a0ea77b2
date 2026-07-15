import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X, Car as CarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  createBrand, createCarModel, deleteBrand, deleteCarModel,
  listBrands, listCarModels, updateBrand, updateCarModel,
} from "@/lib/api";
import {
  TIER_LABEL, TIER_OPTIONS, type Brand, type BrandTier,
} from "@/lib/types";

export const Route = createFileRoute("/brands")({
  ssr: false,
  component: BrandsPage,
});

function BrandsPage() {
  const qc = useQueryClient();
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [modelsOf, setModelsOf] = useState<Brand | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["brands"] });
  const createM = useMutation({
    mutationFn: () => createBrand(newName.trim()),
    onSuccess: () => { toast.success("Добавлено"); setNewName(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updM = useMutation({
    mutationFn: () => updateBrand(editingId!, editName.trim()),
    onSuccess: () => { toast.success("Обновлено"); setEditingId(null); invalidate(); },
  });
  const delM = useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => { toast.success("Удалено"); invalidate(); },
  });

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Марки авто</h1>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Название марки"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && newName.trim() && createM.mutate()}
        />
        <Button onClick={() => newName.trim() && createM.mutate()}>
          <Plus className="mr-2 h-4 w-4" />Добавить
        </Button>
      </div>

      <div className="divide-y rounded-lg border bg-card">
        {brands.map((b) => (
          <div key={b.id} className="flex items-center gap-2 p-2">
            {editingId === b.id ? (
              <>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Button size="icon" onClick={() => updM.mutate()}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="font-medium">{b.name}</div>
                  {b.tier && (
                    <div className="text-xs text-muted-foreground">
                      Класс: {TIER_LABEL[b.tier as BrandTier] ?? b.tier}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setModelsOf(b)}>
                  <CarIcon className="mr-2 h-4 w-4" />Модели
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setEditingId(b.id); setEditName(b.name); }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Удалить марку «${b.name}»?`)) delM.mutate(b.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
        {brands.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">Нет марок</div>
        )}
      </div>

      <Dialog open={!!modelsOf} onOpenChange={(v) => !v && setModelsOf(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Модели · {modelsOf?.name}</DialogTitle>
          </DialogHeader>
          {modelsOf && <ModelsManager brand={modelsOf} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModelsManager({ brand }: { brand: Brand }) {
  const qc = useQueryClient();
  const key = ["car-models", brand.id];
  const { data: models = [] } = useQuery({
    queryKey: key,
    queryFn: () => listCarModels(brand.id),
  });
  const [name, setName] = useState("");
  const [tier, setTier] = useState<string>("inherit");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTier, setEditTier] = useState<string>("inherit");

  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const createM = useMutation({
    mutationFn: () =>
      createCarModel({
        brand_id: brand.id,
        name: name.trim(),
        tier: tier === "inherit" ? null : tier,
      }),
    onSuccess: () => { toast.success("Модель добавлена"); setName(""); setTier("inherit"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updM = useMutation({
    mutationFn: () =>
      updateCarModel(editId!, {
        name: editName.trim(),
        tier: editTier === "inherit" ? null : editTier,
      }),
    onSuccess: () => { toast.success("Сохранено"); setEditId(null); invalidate(); },
  });
  const delM = useMutation({
    mutationFn: (id: string) => deleteCarModel(id),
    onSuccess: () => { toast.success("Удалено"); invalidate(); },
  });

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <Input
          placeholder="Модель, напр. Camry"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && createM.mutate()}
        />
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">
              По марке · {brand.tier ? TIER_LABEL[brand.tier as BrandTier] : "—"}
            </SelectItem>
            {TIER_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>{TIER_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => name.trim() && createM.mutate()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="max-h-96 divide-y overflow-auto rounded border">
        {models.map((m) => {
          const effTier = (m.tier ?? brand.tier) as BrandTier | undefined;
          const isEdit = editId === m.id;
          return (
            <div key={m.id} className="flex items-center gap-2 p-2 text-sm">
              {isEdit ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                  <Select value={editTier} onValueChange={setEditTier}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">По марке</SelectItem>
                      {TIER_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{TIER_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" onClick={() => updM.mutate()}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1">{m.name}</div>
                  <span className="text-xs text-muted-foreground">
                    {effTier ? TIER_LABEL[effTier] : "—"}
                    {m.tier ? "" : " · по марке"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditId(m.id);
                      setEditName(m.name);
                      setEditTier(m.tier ?? "inherit");
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { if (confirm(`Удалить модель «${m.name}»?`)) delM.mutate(m.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
        {models.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">Нет моделей</div>
        )}
      </div>
    </div>
  );
}
