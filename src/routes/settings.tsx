import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X, Car as CarIcon, Settings2, Download } from "lucide-react";
import winDownload from "@/assets/downloads/SamsonCRM-windows.zip.asset.json";
import {
  dbListYearsForBrand,
  dbListModifications,
  dbDeleteModification,
  type DbModification,
} from "@/lib/carsCatalogDb";
import { ModificationForm } from "@/components/ModificationForm";
import { useConfirm } from "@/components/ConfirmDialog";
import { getCredentials, changeCredentials, logout } from "@/lib/authGate";
import { useLoginHero, setLoginHero, resetLoginHero, DEFAULT_LOGIN_HERO } from "@/hooks/useLoginHero";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  createBrand, createCarModel, createService, deleteBrand, deleteCarModel,
  deleteService, deleteServicePrice, listBrands, listCarModels, listServicePrices,
  listServices, updateBrand, updateCarModel, updateService, upsertServicePrice,
} from "@/lib/api";
import {
  TIER_LABEL, TIER_OPTIONS, type Brand, type BrandTier,
} from "@/lib/types";

export const Route = createFileRoute("/settings")({
  ssr: false,
  validateSearch: (input: Record<string, unknown>) => ({
    tab: typeof input.tab === "string" ? input.tab : "brands",
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab =
    tab === "services" ? "services" : tab === "account" ? "account" : "brands";

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Марки и модели авто, услуги и цены, аккаунт.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => navigate({ search: { tab: v } })}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="brands">Марки авто</TabsTrigger>
          <TabsTrigger value="services">Услуги и цены</TabsTrigger>
          <TabsTrigger value="account">Аккаунт</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="mt-4">
          <BrandsTab />
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="account" className="mt-4">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountTab() {
  const navigate = Route.useNavigate();
  const current = getCredentials();
  const [curPass, setCurPass] = useState("");
  const [newLogin, setNewLogin] = useState(current.login);
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const windowsArchiveUrl = new URL(winDownload.url, "https://samson-car.lovable.app").href;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== newPass2) {
      toast.error("Пароли не совпадают");
      return;
    }
    const res = changeCredentials(curPass, newLogin, newPass);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Логин и пароль обновлены. Войдите заново.");
    logout();
    setTimeout(() => {
      window.location.href = "/login";
    }, 400);
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-card p-4">
        <div>
          <div className="mb-1 text-sm text-muted-foreground">Текущий логин</div>
          <div className="font-medium">{current.login}</div>
        </div>
        <div>
          <Label htmlFor="curPass">Текущий пароль</Label>
          <Input
            id="curPass"
            type="password"
            value={curPass}
            onChange={(e) => setCurPass(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <Label htmlFor="newLogin">Новый логин</Label>
          <Input
            id="newLogin"
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <Label htmlFor="newPass">Новый пароль</Label>
          <Input
            id="newPass"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="newPass2">Повторите новый пароль</Label>
          <Input
            id="newPass2"
            type="password"
            value={newPass2}
            onChange={(e) => setNewPass2(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="w-full">Сохранить</Button>
        <p className="text-xs text-muted-foreground">
          Данные хранятся локально в этом браузере/приложении.
        </p>
      </form>

      <LoginHeroCard />

      <a
        href={windowsArchiveUrl}
        download="SamsonCRM-windows.zip"
        className="mt-4 flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:bg-accent"
      >
        <Download className="h-5 w-5 shrink-0" />
        <div className="text-left">
          <div className="font-medium">Скачать для Windows (оффлайн)</div>
          <div className="text-xs text-muted-foreground">
            ZIP ~138 МБ · распакуйте и запустите SamsonCRM.exe · логин тот же
          </div>
        </div>
      </a>

      <button
        type="button"
        onClick={() => {
          if (!confirm("Очистить кэш и перезагрузить приложение? Локальные данные (логин, картинка входа) сохранятся.")) return;
          try {
            const keep: Record<string, string | null> = {
              "samson-crm-auth": localStorage.getItem("samson-crm-auth"),
              "samson-crm-login-hero": localStorage.getItem("samson-crm-login-hero"),
            };
            localStorage.clear();
            sessionStorage.clear();
            for (const [k, v] of Object.entries(keep)) {
              if (v != null) localStorage.setItem(k, v);
            }
            if ("caches" in window) {
              caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
                window.location.reload();
              });
            } else {
              window.location.reload();
            }
          } catch {
            window.location.reload();
          }
        }}
        className="mt-4 flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:bg-accent"
      >
        <Trash2 className="h-5 w-5 shrink-0" />
        <div>
          <div className="font-medium">Очистить кэш</div>
          <div className="text-xs text-muted-foreground">
            Удалит оффлайн-кэш и перезагрузит приложение. Логин и картинка входа сохранятся.
          </div>
        </div>
      </button>

  );
}

function LoginHeroCard() {
  const hero = useLoginHero();
  const isCustom = hero !== DEFAULT_LOGIN_HERO;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Нужен файл изображения");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Максимум 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setLoginHero(String(reader.result));
        toast.success("Картинка входа обновлена");
      } catch {
        toast.error("Не удалось сохранить (переполнено хранилище)");
      }
    };
    reader.onerror = () => toast.error("Не удалось прочитать файл");
    reader.readAsDataURL(f);
  }

  return (
    <div className="mt-4 rounded-lg border bg-card p-4">
      <div className="mb-2 font-medium">Картинка на экране входа</div>
      <div className="mb-3 overflow-hidden rounded-md border">
        <img src={hero} alt="Login hero" className="h-40 w-full object-cover" />
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          Загрузить свою
        </label>
        {isCustom && (
          <Button variant="outline" size="sm" onClick={() => { resetLoginHero(); toast.success("Возвращена стандартная"); }}>
            Сбросить к стандартной
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        До 2 МБ. Хранится локально в этом браузере/приложении.
      </p>
    </div>
  );
}

/* ============================== BRANDS ============================== */

function BrandsTab() {
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
    <div className="mx-auto max-w-2xl">
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
  const [modsOfModel, setModsOfModel] = useState<string | null>(null);


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
                    size="sm"
                    variant="outline"
                    onClick={() => setModsOfModel(m.name)}
                  >
                    <Settings2 className="mr-1 h-4 w-4" />Модификации
                  </Button>
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

      <Dialog open={!!modsOfModel} onOpenChange={(v) => !v && setModsOfModel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Модификации · {brand.name} {modsOfModel}</DialogTitle>
          </DialogHeader>
          {modsOfModel && <ModificationsManager brand={brand.name} modelName={modsOfModel} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModificationsManager({ brand, modelName }: { brand: string; modelName: string }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [yearInput, setYearInput] = useState<string>(String(currentYear));
  const [adding, setAdding] = useState(false);

  const { data: years = [] } = useQuery({
    queryKey: ["catalog-years", brand],
    queryFn: () => dbListYearsForBrand(brand),
  });

  const { data: mods = [] } = useQuery({
    queryKey: ["catalog-mods", brand, year, modelName],
    queryFn: () => dbListModifications(brand, year, modelName),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["catalog-mods", brand, year, modelName] });
    qc.invalidateQueries({ queryKey: ["catalog-years", brand] });
    qc.invalidateQueries({ queryKey: ["catalog-models", brand, year] });
  };

  const removeMod = async (m: DbModification) => {
    const ok = await confirm({
      title: "Удалить модификацию?",
      description: `${m.body_code ?? ""} ${m.engine_code ?? ""} ${m.displacement_cc ?? ""}`.trim() || "Модификация будет удалена без возможности восстановления.",
      confirmText: "Удалить",
      destructive: true,
    });
    if (!ok) return;
    try {
      await dbDeleteModification(m.id);
      toast.success("Удалено");
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div>
          <Label>Год</Label>
          <Input
            type="number"
            className="w-28"
            value={yearInput}
            onChange={(e) => {
              setYearInput(e.target.value);
              const n = Number(e.target.value);
              if (n >= 1900 && n <= 2100) setYear(n);
            }}
          />
        </div>
        {years.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {years.map((y) => (
              <Button
                key={y}
                size="sm"
                variant={y === year ? "default" : "outline"}
                onClick={() => { setYear(y); setYearInput(String(y)); }}
              >
                {y}
              </Button>
            ))}
          </div>
        )}
        <div className="ml-auto">
          <Button size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            {adding ? "Отмена" : "Добавить модификацию"}
          </Button>
        </div>
      </div>

      {adding && (
        <div className="mb-3">
          <ModificationForm
            brand={brand}
            modelName={modelName}
            year={year}
            onCancel={() => setAdding(false)}
            onSaved={() => { setAdding(false); invalidate(); }}
          />
        </div>
      )}

      <div className="max-h-96 divide-y overflow-auto rounded border">
        {mods.map((m) => (
          <div key={m.id} className="flex items-center gap-2 p-2 text-sm">
            <div className="flex-1">
              <div className="font-medium">
                {m.body_code ?? "—"} {m.engine_code ? `· ${m.engine_code}` : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                {m.displacement_cc ? `${m.displacement_cc} cc` : ""}
                {m.horsepower ? ` · ${m.horsepower} л.с.` : ""}
                {m.fuel ? ` · ${m.fuel}` : ""}
                {m.hybrid ? " · гибрид" : ""}
                {m.steering ? ` · ${m.steering}` : ""}
              </div>
              {m.note && <div className="text-xs text-muted-foreground/80">{m.note}</div>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => removeMod(m)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {mods.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            Нет модификаций за {year} год
          </div>
        )}
      </div>

    </div>
  );
}

/* ============================= SERVICES ============================= */

function ServicesTab() {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [payouts, setPayouts] = useState<Record<string, number>>({});
  const [pricesOpen, setPricesOpen] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", category: "", base_price: 0, duration_minutes: 60 });

  const categories = useMemo(() => Array.from(new Set(services.map((s) => s.category))), [services]);

  const updM = useMutation({
    mutationFn: (v: { id: string; base_price?: number; duration_minutes?: number; default_payout_percent?: number }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateService(v.id, v as any),
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
    <div>
      <div className="mb-4 flex items-center justify-end">
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
                  <TableHead className="w-32">Базовая цена, ₽</TableHead>
                  <TableHead className="w-24">Длит., мин</TableHead>
                  <TableHead className="w-28">% мастеру</TableHead>
                  <TableHead className="w-64"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.filter((s) => s.category === cat).map((s) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const svcAny = s as any;
                  const svcPct = Number(svcAny.default_payout_percent ?? 50);
                  const price = prices[s.id] ?? s.base_price;
                  const dur = durations[s.id] ?? s.duration_minutes;
                  const pct = payouts[s.id] ?? svcPct;
                  const changed = price !== s.base_price || dur !== s.duration_minutes || pct !== svcPct;
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
                      <TableCell>
                        <Input
                          type="number"
                          value={pct}
                          onChange={(e) => setPayouts({ ...payouts, [s.id]: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={!changed}
                          onClick={() => updM.mutate({ id: s.id, base_price: price, duration_minutes: dur, default_payout_percent: pct })}
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

      {services.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Пока нет услуг — добавьте первую.
        </div>
      )}

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
