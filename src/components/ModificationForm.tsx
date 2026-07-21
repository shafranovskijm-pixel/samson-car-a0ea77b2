import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { dbAddModification } from "@/lib/carsCatalogDb";
import { humanizeSupabaseError } from "@/lib/api";

export type ModificationFormValue = {
  body_code: string;
  engine_code: string;
  displacement_cc: string;
  horsepower: string;
  fuel: string;
  hybrid: boolean;
  steering: string;
  note: string;
};

const empty: ModificationFormValue = {
  body_code: "",
  engine_code: "",
  displacement_cc: "",
  horsepower: "",
  fuel: "",
  hybrid: false,
  steering: "",
  note: "",
};

export function ModificationForm({
  brand,
  modelName,
  year,
  onCancel,
  onSaved,
  compact = false,
}: {
  brand: string;
  modelName: string;
  year: number;
  onCancel?: () => void;
  onSaved?: () => void;
  compact?: boolean;
}) {
  const [form, setForm] = useState<ModificationFormValue>(empty);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await dbAddModification({
        brand,
        modelName,
        year,
        body_code: form.body_code.trim() || null,
        engine_code: form.engine_code.trim() || null,
        displacement_cc: form.displacement_cc ? Number(form.displacement_cc) : null,
        horsepower: form.horsepower ? Number(form.horsepower) : null,
        fuel: form.fuel.trim() || null,
        hybrid: form.hybrid,
        steering: form.steering.trim() || null,
        note: form.note.trim() || null,
      });
      toast.success("Модификация добавлена");
      setForm(empty);
      onSaved?.();
    } catch (e) {
      toast.error(humanizeSupabaseError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? "" : "rounded-xl border bg-card p-3"}>
      <div className="mb-2 text-sm font-medium text-muted-foreground">
        {brand} {modelName} · {year}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input
          placeholder="Кузов (SXV20)"
          value={form.body_code}
          onChange={(e) => setForm({ ...form, body_code: e.target.value })}
        />
        <Input
          placeholder="Код двигателя (5S-FE)"
          value={form.engine_code}
          onChange={(e) => setForm({ ...form, engine_code: e.target.value })}
        />
        <Input
          placeholder="Объём, см³ (2200)"
          inputMode="numeric"
          value={form.displacement_cc}
          onChange={(e) =>
            setForm({ ...form, displacement_cc: e.target.value.replace(/\D/g, "") })
          }
        />
        <Input
          placeholder="Мощность, л.с. (135)"
          inputMode="numeric"
          value={form.horsepower}
          onChange={(e) =>
            setForm({ ...form, horsepower: e.target.value.replace(/\D/g, "") })
          }
        />
        <Input
          placeholder="Топливо (бензин / дизель)"
          value={form.fuel}
          onChange={(e) => setForm({ ...form, fuel: e.target.value })}
        />
        <Input
          placeholder="Руль (левый / правый)"
          value={form.steering}
          onChange={(e) => setForm({ ...form, steering: e.target.value })}
        />
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            id="mod-hybrid"
            checked={form.hybrid}
            onCheckedChange={(v) => setForm({ ...form, hybrid: !!v })}
          />
          <Label htmlFor="mod-hybrid" className="cursor-pointer">Гибрид</Label>
        </div>
        <Input
          placeholder="Заметка (опц.)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        )}
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
