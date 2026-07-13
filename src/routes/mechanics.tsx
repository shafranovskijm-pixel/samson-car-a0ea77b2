import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createMechanic, deleteMechanic, listMechanics, updateMechanic } from "@/lib/api";
import type { Mechanic } from "@/lib/types";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export const Route = createFileRoute("/mechanics")({
  ssr: false,
  component: MechanicsPage,
});

function MechanicsPage() {
  const qc = useQueryClient();
  const { data: mechanics = [] } = useQuery({ queryKey: ["mechanics"], queryFn: listMechanics });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mechanic | null>(null);
  const [form, setForm] = useState({ full_name: "", specialization: "", phone: "", color: COLORS[0] });

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: "", specialization: "", phone: "", color: COLORS[mechanics.length % COLORS.length] });
    setOpen(true);
  };
  const openEdit = (m: Mechanic) => {
    setEditing(m);
    setForm({
      full_name: m.full_name,
      specialization: m.specialization ?? "",
      phone: m.phone ?? "",
      color: m.color,
    });
    setOpen(true);
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Введите ФИО");
      const payload = {
        full_name: form.full_name.trim(),
        specialization: form.specialization.trim() || null,
        phone: form.phone.trim() || null,
        color: form.color,
      };
      if (editing) await updateMechanic(editing.id, payload);
      else await createMechanic(payload);
    },
    onSuccess: () => {
      toast.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["mechanics"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delM = useMutation({
    mutationFn: (id: string) => deleteMechanic(id),
    onSuccess: () => {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["mechanics"] });
    },
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мастера</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Добавить</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>ФИО</TableHead>
              <TableHead>Специализация</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mechanics.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <span className="inline-block h-4 w-4 rounded" style={{ background: m.color }} />
                </TableCell>
                <TableCell className="font-medium">{m.full_name}</TableCell>
                <TableCell>{m.specialization ?? "—"}</TableCell>
                <TableCell>{m.phone ?? "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { if (confirm("Удалить мастера?")) delM.mutate(m.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {mechanics.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Пока нет мастеров
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать мастера" : "Новый мастер"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>ФИО</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Специализация</Label>
              <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Цвет в календаре</Label>
              <div className="mt-2 flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-md border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
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
