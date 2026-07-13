import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrand, deleteBrand, listBrands, updateBrand } from "@/lib/api";

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
                <div className="flex-1 font-medium">{b.name}</div>
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
    </div>
  );
}
