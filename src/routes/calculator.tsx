import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Check,
  X,
  Star,
  Car as CarIcon,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { listBrands, listCars, listServices, listServiceCategories, upsertServiceByCategoryName, humanizeSupabaseError } from "@/lib/api";
import {
  TIER_COEFFICIENT,
  TIER_LABEL,
  resolveTier,
  type BrandTier,
} from "@/lib/types";
import {
  getAllCatalogBrandNames,
  getModifications,
  getModelsForBrandYear,
  getYearsForBrand,
  popularBrands,
  type CatalogModification,
} from "@/lib/cars-catalog";
import {
  dbListYearsForBrand,
  dbListModelsForBrandYear,
  dbListModifications,
  dbAddModification,
  type DbModification,
} from "@/lib/carsCatalogDb";
import { BrandLogo } from "@/components/BrandLogo";
import { PrintDocument, type PrintKV } from "@/components/PrintDocument";
import { useServiceUsage } from "@/hooks/useServiceUsage";
import { useCarCustomServices } from "@/hooks/useCarCustomServices";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { usePriceOverrides } from "@/hooks/usePriceOverrides";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

const OTHER_CATEGORY = "Прочие услуги";

// Цветной градиент как аккуратный плейсхолдер, если у категории нет своей картинки.
const gradientForName = (name: string): string => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${(hue + 40) % 360} 55% 22%))`;
};

const calculatorSearchSchema = z.object({
  carId: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute("/calculator")({
  ssr: false,
  validateSearch: zodValidator(calculatorSearchSchema),
  head: () => ({
    meta: [
      { title: "Samson Auto — автосервис · калькулятор стоимости" },
      {
        name: "description",
        content:
          "Samson Auto — современный автосервис. Онлайн-калькулятор стоимости услуг для любой марки авто, запись в удобное время.",
      },
      { property: "og:title", content: "Samson Auto — автосервис" },
      {
        property: "og:description",
        content: "Калькулятор стоимости, полный прайс услуг и онлайн-запись.",
      },
    ],
  }),
  component: LandingPage,
});

type Step = 1 | 2 | 3;

function LandingPage() {
  const { carId } = Route.useSearch();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["service_categories"],
    queryFn: listServiceCategories,
  });
  const { data: cars = [] } = useQuery({
    queryKey: ["cars"],
    queryFn: listCars,
    enabled: !!carId,
  });

  const [step, setStep] = useState<Step>(1);

  // Выбор авто
  const [brandName, setBrandName] = useState<string>("");
  const [year, setYear] = useState<number | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [modIndex, setModIndex] = useState<number | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [yearInput, setYearInput] = useState("");
  const [addingMod, setAddingMod] = useState(false);
  const [carFromClient, setCarFromClient] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);
  const [addForm, setAddForm] = useState({
    body_code: "",
    engine_code: "",
    displacement_cc: "",
    horsepower: "",
    fuel: "",
    note: "",
  });
  const [savingMod, setSavingMod] = useState(false);

  // Услуги
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState({ name: "", price: "", minutes: "30" });
  const [savingCustom, setSavingCustom] = useState(false);
  const [printing, setPrinting] = useState(false);

  const { bump, topServiceIds } = useServiceUsage();
  const customServices = useCarCustomServices(brandName, modelName, year);
  const customId = (id: string) => `custom:${id}`;

  // Матчинг марки JSON → БД
  const dbBrand = useMemo(
    () =>
      brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase()) ??
      null,
    [brands, brandName],
  );
  const brandId = dbBrand?.id ?? null;
  const tier: BrandTier = resolveTier(dbBrand, null);
  const coeff = TIER_COEFFICIENT[tier];

  const { prices, setPrice, resetPrice } = usePriceOverrides(brandId);

  const priceOf = (serviceId: string, basePrice: number) => {
    if (prices[serviceId] != null) return prices[serviceId];
    if (brandId) return Math.round((basePrice * coeff) / 50) * 50;
    return basePrice;
  };

  const qc = useQueryClient();

  // Данные из БД + fallback на JSON
  const yearsQ = useQuery({
    queryKey: ["catalog-years", brandName],
    queryFn: () => dbListYearsForBrand(brandName),
    enabled: !!brandName,
  });
  const years = useMemo(() => {
    const j = brandName ? getYearsForBrand(brandName) : [];
    const merged = new Set<number>([...(yearsQ.data ?? []), ...j]);
    return Array.from(merged).sort((a, b) => b - a);
  }, [brandName, yearsQ.data]);

  const modelsQ = useQuery({
    queryKey: ["catalog-models", brandName, year],
    queryFn: () => dbListModelsForBrandYear(brandName, year!),
    enabled: !!brandName && year != null,
  });
  const models = useMemo(() => {
    const j = brandName && year ? getModelsForBrandYear(brandName, year) : [];
    const names = new Set<string>();
    const list: { name: string }[] = [];
    (modelsQ.data ?? []).forEach((m) => {
      if (!names.has(m.name.toLowerCase())) {
        names.add(m.name.toLowerCase());
        list.push({ name: m.name });
      }
    });
    j.forEach((m) => {
      if (!names.has(m.name.toLowerCase())) {
        names.add(m.name.toLowerCase());
        list.push({ name: m.name });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [brandName, year, modelsQ.data]);

  const modsQ = useQuery({
    queryKey: ["catalog-mods", brandName, year, modelName],
    queryFn: () => dbListModifications(brandName, year!, modelName),
    enabled: !!brandName && year != null && !!modelName,
  });

  // Единый тип для отображения (нормализуем DB и JSON)
  type UiMod = {
    key: string;
    body_code: string | null;
    engine_code: string | null;
    displacement_cc: number | null;
    horsepower: number | null;
    fuel: string | null;
    hybrid: boolean;
    note: string | null;
    source: "db" | "json";
    dbId?: string;
  };

  const modifications: UiMod[] = useMemo(() => {
    const out: UiMod[] = [];
    const seen = new Set<string>();
    (modsQ.data ?? []).forEach((m: DbModification) => {
      const k = `db:${m.id}`;
      if (seen.has(k)) return;
      seen.add(k);
      out.push({
        key: k,
        body_code: m.body_code,
        engine_code: m.engine_code,
        displacement_cc: m.displacement_cc,
        horsepower: m.horsepower,
        fuel: m.fuel,
        hybrid: m.hybrid,
        note: m.note,
        source: "db",
        dbId: m.id,
      });
    });
    const j: CatalogModification[] =
      brandName && year && modelName ? getModifications(brandName, year, modelName) : [];
    j.forEach((m, i) => {
      const dedup = `${m.body_code ?? ""}|${m.engine_code ?? ""}|${m.displacement_cc ?? ""}|${m.horsepower ?? ""}`;
      if (out.some((o) => `${o.body_code ?? ""}|${o.engine_code ?? ""}|${o.displacement_cc ?? ""}|${o.horsepower ?? ""}` === dedup)) return;
      out.push({
        key: `json:${i}`,
        body_code: m.body_code,
        engine_code: m.engine_code,
        displacement_cc: m.displacement_cc,
        horsepower: m.horsepower,
        fuel: m.fuel,
        hybrid: m.hybrid,
        note: m.note,
        source: "json",
      });
    });
    return out;
  }, [modsQ.data, brandName, year, modelName]);

  const currentMod = modIndex != null ? modifications[modIndex] : null;

  // Автовыбор года, когда выбрана марка
  useEffect(() => {
    if (brandName && years.length && year == null) setYear(years[0]);
  }, [brandName, years, year]);

  // Префилл авто из карточки клиента (?carId=...)
  useEffect(() => {
    if (!carId || prefillDone) return;
    if (cars.length === 0) return;
    const car = cars.find((c) => c.id === carId);
    if (!car) {
      setPrefillDone(true);
      return;
    }
    const brand = brands.find((b) => b.id === car.brand_id);
    if (!brand) return;
    setBrandName(brand.name);
    if (car.year) setYear(car.year);
    if (car.model) setModelName(car.model);
    setCarFromClient(true);
    setPrefillDone(true);
    setStep(2);
  }, [carId, cars, brands, prefillDone]);

  // Список категорий из БД + гарантируем наличие "Прочие услуги"
  const catList = useMemo(() => {
    const list = [...dbCategories];
    if (!list.some((c) => c.name.toLowerCase() === OTHER_CATEGORY.toLowerCase())) {
      list.push({ id: "__other", name: OTHER_CATEGORY, image_url: null, sort_order: 1000 });
    }
    return list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [dbCategories]);

  const knownCatSet = useMemo(
    () => new Set(dbCategories.map((c) => c.name.toLowerCase())),
    [dbCategories],
  );

  // Услуги по категориям (неизвестные категории → "Прочие услуги")
  const byCategory = useMemo(() => {
    const map: Record<string, typeof services> = {};
    services.forEach((s) => {
      const cat = knownCatSet.has((s.category ?? "").toLowerCase()) ? s.category : OTHER_CATEGORY;
      (map[cat] ??= []).push(s);
    });
    return map;
  }, [services, knownCatSet]);

  const popularServices = useMemo(() => {
    const ids = topServiceIds(6);
    return ids
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [services, topServiceIds]);

  const totals = useMemo(() => {
    let sum = 0;
    let mins = 0;
    services.forEach((s) => {
      if (selected.has(s.id)) {
        sum += priceOf(s.id, s.base_price);
        mins += s.duration_minutes;
      }
    });
    customServices.items.forEach((c) => {
      if (selected.has(customId(c.id))) {
        sum += Number(c.price) || 0;
        mins += c.duration_minutes;
      }
    });
    return { sum, mins };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, services, prices, brandId, coeff, customServices.items]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  const fmtDur = (m: number) => {
    if (m < 60) return `${m} мин`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h} ч ${r} мин` : `${h} ч`;
  };

  const carReady =
    !!brandName && year != null && !!modelName && (modIndex != null || carFromClient);

  const goStep = (s: Step) => {
    if (s === 1) setStep(1);
    if (s === 2 && carReady) setStep(2);
    if (s === 3 && carReady && selected.size > 0) setStep(3);
  };

  const goToServices = () => {
    if (carReady) setStep(2);
  };

  const goToSummary = () => {
    if (selected.size === 0) return;
    bump(Array.from(selected).filter((id) => !id.startsWith("custom:")));
    setStep(3);
  };

  const StepBadge = ({ n, label }: { n: Step; label: string }) => {
    const active = step === n;
    const done = (n === 1 && step > 1) || (n === 2 && step > 2);
    const reachable =
      n === 1 || (n === 2 && carReady) || (n === 3 && carReady && selected.size > 0);
    return (
      <button
        type="button"
        disabled={!reachable}
        onClick={() => goStep(n)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
          active
            ? "bg-red-600 text-white"
            : done
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-white/5 text-white/50"
        } ${!reachable ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            active ? "bg-white/20" : done ? "bg-red-600 text-white" : "bg-white/10"
          }`}
        >
          {n}
        </span>
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  };

  const catalogBrandNames = getAllCatalogBrandNames();
  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    const list = q ? catalogBrandNames.filter((n) => n.toLowerCase().includes(q)) : catalogBrandNames;
    return list;
  }, [catalogBrandNames, brandSearch]);

  const popular = popularBrands();

  // Компактная карточка выбранного авто (в шаге 2/3)
  const CarSummary = () => (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <BrandLogo brand={brandName} logoUrl={dbBrand?.logo_url ?? null} size={40} className="rounded-md bg-white p-1" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-white">
          {brandName} {modelName}{" "}
          <span className="font-normal text-white/60">· {year}</span>
        </div>
        {currentMod && (
          <div className="truncate text-xs text-white/60">
            {currentMod.body_code ? `${currentMod.body_code} · ` : ""}
            {currentMod.engine_code ? `${currentMod.engine_code} · ` : ""}
            {currentMod.displacement_cc ? `${currentMod.displacement_cc} cc · ` : ""}
            {currentMod.horsepower ? `${currentMod.horsepower} л.с. · ` : ""}
            {currentMod.fuel ?? ""}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setStep(1)}
        className="text-white/70 hover:text-white"
      >
        Изменить
      </Button>
    </div>
  );

  return (
    <div className="min-h-full bg-[#0a0a0f] text-white">
      <section id="calculator" className="relative py-8 sm:py-12">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-red-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <StepBadge n={1} label="Авто" />
            <ChevronRight className="h-4 w-4 text-white/30" />
            <StepBadge n={2} label="Услуги" />
            <ChevronRight className="h-4 w-4 text-white/30" />
            <StepBadge n={3} label="Итог" />
          </div>

          {/* ШАГ 1 — АВТО */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Марка */}
              {!brandName && (
                <div>
                  <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Выберите марку</h2>

                  <div className="mb-2 text-sm text-white/50">Популярные марки</div>
                  <div className="mb-8 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-10">
                    {popular.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBrandName(n)}
                        className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-white p-2 transition hover:border-red-500/60 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]"
                        title={n}
                      >
                        <BrandLogo brand={n} logoUrl={brands.find((b) => b.name === n)?.logo_url ?? null} size={44} />
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 text-sm text-white/50">Все марки</div>
                  <div className="relative mb-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Поиск марки"
                      className="h-12 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 md:grid-cols-4">
                    {filteredBrands.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBrandName(n)}
                        className="rounded-lg px-3 py-2 text-left font-semibold text-white transition hover:bg-white/10"
                        title={n}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Год / Модель / Модификация */}
              {brandName && (
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandName("");
                      setYear(null);
                      setModelName("");
                      setModIndex(null);
                    }}
                    className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" /> Другая марка
                  </button>

                  <div className="flex items-center gap-3">
                    <BrandLogo brand={brandName} logoUrl={dbBrand?.logo_url ?? null} size={56} className="rounded-lg bg-white p-1.5" />
                    <div>
                      <h2 className="text-2xl font-bold">{brandName}</h2>
                      {dbBrand ? (
                        <div className="text-xs text-white/50">
                          Класс: {TIER_LABEL[tier]} · × {coeff.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-xs text-amber-400/80">
                          Марка не в справочнике цен — расчёт по базовым ценам
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Год */}
                  <div>
                    <div className="mb-2 text-sm text-white/50">Год выпуска</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {years.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setYear(y);
                            setModelName("");
                            setModIndex(null);
                          }}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            year === y
                              ? "bg-red-600 text-white"
                              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                      <div className="flex items-center gap-1">
                        <Input
                          value={yearInput}
                          onChange={(e) => setYearInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="другой год"
                          inputMode="numeric"
                          className="h-9 w-28 border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={yearInput.length !== 4}
                          onClick={() => {
                            const y = Number(yearInput);
                            if (y >= 1950 && y <= 2100) {
                              setYear(y);
                              setModelName("");
                              setModIndex(null);
                              setYearInput("");
                            }
                          }}
                        >
                          Добавить
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Модель */}
                  {year != null && (
                    <div>
                      <div className="mb-2 text-sm text-white/50">Модель</div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {models.map((m) => (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => {
                              setModelName(m.name);
                              setModIndex(null);
                              setAddingMod(false);
                            }}
                            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                              modelName === m.name
                                ? "border-red-500/70 bg-red-500/10 text-white"
                                : "border-white/10 bg-white/5 text-white/80 hover:border-white/20"
                            }`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          value={modelInput}
                          onChange={(e) => setModelInput(e.target.value)}
                          placeholder="Другая модель (например Camry)"
                          className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!modelInput.trim()}
                          onClick={() => {
                            setModelName(modelInput.trim());
                            setModelInput("");
                            setModIndex(null);
                            setAddingMod(true);
                          }}
                        >
                          Добавить
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Модификация */}
                  {modelName && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm text-white/50">Модификация</div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddingMod((v) => !v)}
                          className="text-white/70 hover:text-white"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          {addingMod ? "Отмена" : "Добавить модификацию"}
                        </Button>
                      </div>

                      {modifications.length === 0 && !addingMod && (
                        <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/60">
                          Для этой модели/года пока нет модификаций — добавьте свою.
                        </div>
                      )}

                      <div className="grid gap-2 sm:grid-cols-2">
                        {modifications.map((m, i) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setModIndex(i)}
                            className={`rounded-xl border p-3 text-left transition ${
                              modIndex === i
                                ? "border-red-500/70 bg-red-500/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="text-sm font-semibold text-white">
                              {m.body_code ?? "—"} · {m.engine_code ?? ""}
                            </div>
                            <div className="mt-1 text-xs text-white/60">
                              {m.displacement_cc ? `${m.displacement_cc} cc` : ""}
                              {m.horsepower ? ` · ${m.horsepower} л.с.` : ""}
                              {m.fuel ? ` · ${m.fuel}` : ""}
                              {m.hybrid ? " · гибрид" : ""}
                            </div>
                            {m.note && (
                              <div className="mt-1 text-xs text-white/40">{m.note}</div>
                            )}
                          </button>
                        ))}
                      </div>

                      {addingMod && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="mb-3 text-sm font-semibold text-white">
                            Новая модификация · {brandName} {modelName} · {year}
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input
                              placeholder="Кузов (например SXV20)"
                              value={addForm.body_code}
                              onChange={(e) => setAddForm({ ...addForm, body_code: e.target.value })}
                              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                            />
                            <Input
                              placeholder="Код двигателя (5S-FE)"
                              value={addForm.engine_code}
                              onChange={(e) => setAddForm({ ...addForm, engine_code: e.target.value })}
                              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                            />
                            <Input
                              placeholder="Объём, см³ (2200)"
                              value={addForm.displacement_cc}
                              onChange={(e) =>
                                setAddForm({ ...addForm, displacement_cc: e.target.value.replace(/\D/g, "") })
                              }
                              inputMode="numeric"
                              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                            />
                            <Input
                              placeholder="Мощность, л.с. (135)"
                              value={addForm.horsepower}
                              onChange={(e) =>
                                setAddForm({ ...addForm, horsepower: e.target.value.replace(/\D/g, "") })
                              }
                              inputMode="numeric"
                              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                            />
                            <Input
                              placeholder="Топливо (бензин / дизель)"
                              value={addForm.fuel}
                              onChange={(e) => setAddForm({ ...addForm, fuel: e.target.value })}
                              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                            />
                            <Input
                              placeholder="Заметка (опц.)"
                              value={addForm.note}
                              onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                            />
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setAddingMod(false)}
                              className="text-white/70"
                            >
                              Отмена
                            </Button>
                            <Button
                              type="button"
                              disabled={savingMod || !year}
                              onClick={async () => {
                                if (!year) return;
                                setSavingMod(true);
                                try {
                                  await dbAddModification({
                                    brand: brandName,
                                    modelName,
                                    year,
                                    body_code: addForm.body_code.trim() || null,
                                    engine_code: addForm.engine_code.trim() || null,
                                    displacement_cc: addForm.displacement_cc
                                      ? Number(addForm.displacement_cc)
                                      : null,
                                    horsepower: addForm.horsepower ? Number(addForm.horsepower) : null,
                                    fuel: addForm.fuel.trim() || null,
                                    note: addForm.note.trim() || null,
                                  });
                                  await Promise.all([
                                    qc.invalidateQueries({ queryKey: ["catalog-mods", brandName, year, modelName] }),
                                    qc.invalidateQueries({ queryKey: ["catalog-models", brandName, year] }),
                                    qc.invalidateQueries({ queryKey: ["catalog-years", brandName] }),
                                  ]);
                                  setAddForm({
                                    body_code: "",
                                    engine_code: "",
                                    displacement_cc: "",
                                    horsepower: "",
                                    fuel: "",
                                    note: "",
                                  });
                                  setAddingMod(false);
                                  // авто-выбираем последнюю добавленную (появится наверху db-списка)
                                  setModIndex(0);
                                } catch (e) {
                                  console.error(e);
                                  alert("Не удалось сохранить модификацию (нужно войти).");
                                } finally {
                                  setSavingMod(false);
                                }
                              }}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {savingMod ? "Сохранение…" : "Сохранить"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Липкий футер шага 1 */}
              {brandName && (
                <div className="sticky bottom-4 z-20 mt-8">
                  <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur">
                    <div className="min-w-0 text-sm">
                      <div className="text-white/60">Ваше авто</div>
                      <div className="truncate text-base font-bold text-white">
                        {brandName} {modelName} {year ? `· ${year}` : ""}
                      </div>
                    </div>
                    <Button
                      size="lg"
                      disabled={!carReady}
                      onClick={goToServices}
                      className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Далее — услуги <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ШАГ 2 — УСЛУГИ */}
          {step === 2 && (
            <div className="space-y-6">
              <CarSummary />

              {popularServices.length > 0 && !activeCategory && (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                    <Star className="h-4 w-4 text-amber-400" /> Популярные услуги
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {popularServices.map((s) => {
                      const active = selected.has(s.id);
                      const price = priceOf(s.id, s.base_price);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggle(s.id)}
                          className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition ${
                            active
                              ? "border-red-500/60 bg-red-500/10"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-white">
                              {s.name}
                            </div>
                            <div className="text-xs text-white/50">{fmt(price)}</div>
                          </div>
                          {active ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-red-500" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!activeCategory ? (
                <>
                  <div className="text-lg font-semibold text-white">
                    Выберите категорию услуг
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {catList.map((c) => {
                      const count = byCategory[c.name]?.length ?? 0;
                      const selectedInCat =
                        byCategory[c.name]?.filter((s) => selected.has(s.id)).length ?? 0;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setActiveCategory(c.name)}
                          className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition-all hover:border-red-500/50 hover:shadow-[0_10px_40px_-10px_rgba(239,68,68,0.4)]"
                        >
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                              style={{ background: gradientForName(c.name) }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                          {selectedInCat > 0 && (
                            <div className="absolute right-4 top-4 flex h-9 min-w-9 items-center justify-center rounded-full bg-red-600 px-2.5 text-sm font-bold text-white shadow-lg">
                              {selectedInCat}
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-6">
                            <div className="text-2xl font-bold leading-tight text-white">
                              {c.name}
                            </div>
                            <div className="mt-2 text-sm text-white/70">
                              {count} услуг · нажмите чтобы открыть
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="mb-4 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" /> Все категории
                  </button>
                  <div className="mb-4 flex items-center gap-3">
                    {(() => {
                      const cur = catList.find((c) => c.name === activeCategory);
                      return cur?.image_url ? (
                        <img
                          src={cur.image_url}
                          alt=""
                          className="h-14 w-20 rounded-lg object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div
                          className="h-14 w-20 rounded-lg ring-1 ring-white/10"
                          style={{ background: gradientForName(activeCategory) }}
                        />
                      );
                    })()}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{activeCategory}</h3>
                      <div className="text-xs text-white/50">
                        {(byCategory[activeCategory]?.length ?? 0) +
                          customServices.items.filter((c) => c.category === activeCategory).length}{" "}
                        услуг
                      </div>
                    </div>
                    {customServices.enabled && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setAddingCustom((v) => !v)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {addingCustom ? "Отмена" : "Добавить услугу"}
                      </Button>
                    )}
                  </div>

                  {addingCustom && customServices.enabled && (
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 text-xs text-white/60">
                        Только для {brandName} {modelName} · {year}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-3">
                          <Input
                            placeholder="Название услуги"
                            value={customDraft.name}
                            onChange={(e) => setCustomDraft({ ...customDraft, name: e.target.value })}
                            className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                          />
                          {(() => {
                            const n = customDraft.name.trim().toLowerCase();
                            if (!n || !activeCategory) return null;
                            const dup = customServices.items.find(
                              (x) =>
                                x.category === activeCategory &&
                                x.name.trim().toLowerCase() === n,
                            );
                            if (!dup) return null;
                            return (
                              <div className="mt-1 text-xs text-amber-300">
                                Уже есть, цена {dup.price} ₽ — сохранение перезапишет цену
                              </div>
                            );
                          })()}
                        </div>
                        <Input
                          placeholder="Цена, ₽"
                          value={customDraft.price}
                          onChange={(e) =>
                            setCustomDraft({ ...customDraft, price: e.target.value.replace(/\D/g, "") })
                          }
                          inputMode="numeric"
                          className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                        />
                        <Input
                          placeholder="Длительность, мин"
                          value={customDraft.minutes}
                          onChange={(e) =>
                            setCustomDraft({ ...customDraft, minutes: e.target.value.replace(/\D/g, "") })
                          }
                          inputMode="numeric"
                          className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                        />
                        <Button
                          type="button"
                          disabled={savingCustom || !customDraft.name.trim() || !customDraft.price}
                          onClick={async () => {
                            setSavingCustom(true);
                            try {
                              const res = await customServices.add({
                                category: activeCategory!,
                                name: customDraft.name.trim(),
                                price: Number(customDraft.price) || 0,
                                duration_minutes: Number(customDraft.minutes) || 30,
                              });
                              if (res?.wasUpdate) {
                                toast.success(
                                  `Цена обновлена: ${res.row.name} — ${res.row.price} ₽`,
                                );
                              } else if (res) {
                                toast.success(
                                  `Добавлено для ${brandName} ${modelName} ${year}: ${res.row.name}`,
                                );
                              }
                              setCustomDraft({ name: "", price: "", minutes: "30" });
                              setAddingCustom(false);
                            } catch (e) {
                              console.error(e);
                              toast.error(humanizeSupabaseError(e));
                            } finally {
                              setSavingCustom(false);
                            }
                          }}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          {savingCustom ? "Сохранение…" : "Сохранить"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {customServices.items
                      .filter((c) => c.category === activeCategory)
                      .map((c) => {
                        const sid = customId(c.id);
                        const active = selected.has(sid);
                        return (
                          <div
                            key={sid}
                            className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                              active
                                ? "border-red-500/60 bg-gradient-to-br from-red-500/15 to-orange-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            }`}
                          >
                              <div className="flex items-start gap-3">
                              <div onClick={() => toggle(sid)} className="mt-1">
                                <Checkbox
                                  checked={active}
                                  className="border-white/30 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggle(sid)}
                                    className="block flex-1 text-left font-medium text-white"
                                  >
                                    {c.name}
                                    <span className="ml-2 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                                      только для этого авто
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const ok = await confirm({
                                        title: "Удалить услугу?",
                                        description: `Услуга «${c.name}» будет удалена только для ${brandName} ${modelName} ${year}.`,
                                        destructive: true,
                                        confirmText: "Удалить",
                                      });
                                      if (!ok) return;
                                      try {
                                        await customServices.remove(c.id);
                                        setSelected((prev) => {
                                          const n = new Set(prev);
                                          n.delete(sid);
                                          return n;
                                        });
                                      } catch (e) {
                                        console.error(e);
                                        toast.error("Не удалось удалить.");
                                      }
                                    }}
                                    className="rounded p-1 text-white/40 hover:bg-red-500/20 hover:text-red-400"
                                    aria-label="Удалить"
                                    title="Удалить"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {fmtDur(c.duration_minutes)}
                                  </span>
                                </div>
                                <div className="mt-3 text-lg font-bold text-white">
                                  {fmt(Number(c.price) || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {(byCategory[activeCategory] ?? []).map((s) => {
                      const active = selected.has(s.id);
                      const price = priceOf(s.id, s.base_price);
                      const isEditing = editingPrice === s.id;
                      const hasOverride = prices[s.id] != null;
                      return (
                        <div
                          key={s.id}
                          className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                            active
                              ? "border-red-500/60 bg-gradient-to-br from-red-500/15 to-orange-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_10px_40px_-10px_rgba(239,68,68,0.4)]"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div onClick={() => toggle(s.id)} className="mt-1">
                              <Checkbox
                                checked={active}
                                className="border-white/30 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggle(s.id)}
                                className="block w-full text-left font-medium text-white"
                              >
                                {s.name}
                              </button>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {fmtDur(s.duration_minutes)}
                                </span>
                                {hasOverride && (
                                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                                    цена сохранена
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <Input
                                      autoFocus
                                      value={priceDraft}
                                      onChange={(e) => setPriceDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          const v = parseInt(priceDraft, 10);
                                          if (!Number.isNaN(v) && v >= 0) {
                                            setPrice(s.id, v);
                                          }
                                          setEditingPrice(null);
                                        }
                                        if (e.key === "Escape") setEditingPrice(null);
                                      }}
                                      className="h-9 w-28 border-white/10 bg-white/5 text-white"
                                      inputMode="numeric"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const v = parseInt(priceDraft, 10);
                                        if (!Number.isNaN(v) && v >= 0) setPrice(s.id, v);
                                        setEditingPrice(null);
                                      }}
                                      className="rounded p-1 text-emerald-400 hover:bg-white/10"
                                      aria-label="Сохранить"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPrice(null)}
                                      className="rounded p-1 text-white/60 hover:bg-white/10"
                                      aria-label="Отмена"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-lg font-bold text-white">
                                      {fmt(price)}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPrice(s.id);
                                        setPriceDraft(String(price));
                                      }}
                                      className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
                                      aria-label="Изменить цену"
                                      title="Изменить цену"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    {hasOverride && (
                                      <button
                                        type="button"
                                        onClick={() => resetPrice(s.id)}
                                        className="text-xs text-white/40 underline underline-offset-2 hover:text-white/70"
                                      >
                                        сброс
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {active && (
                            <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                    {(byCategory[activeCategory]?.length ?? 0) === 0 &&
                      customServices.items.filter((c) => c.category === activeCategory).length === 0 && (
                        <div className="col-span-full rounded-lg border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                          В этой категории пока нет услуг
                        </div>
                      )}
                  </div>
                </div>
              )}

              {services.length === 0 && (
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="p-8 text-center text-white/60">
                    Загружаем прайс...
                  </CardContent>
                </Card>
              )}

              <div className="sticky bottom-4 z-20 mt-8">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur">
                  <div className="text-sm">
                    <div className="text-white/60">Выбрано услуг</div>
                    <div className="text-lg font-bold text-white">
                      {selected.size}{" "}
                      <span className="text-sm font-normal text-white/60">
                        · {fmt(totals.sum)} · ≈ {fmtDur(totals.mins || 0)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    disabled={selected.size === 0}
                    onClick={goToSummary}
                    className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Далее — итог <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ШАГ 3 — ИТОГ */}
          {step === 3 && (
            <div className="mx-auto max-w-2xl space-y-4">
              <CarSummary />
              <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-5">
                  <div className="text-xs uppercase tracking-wider text-white/80">Ваш заказ</div>
                  <div className="mt-1 text-4xl font-bold text-white">{fmt(totals.sum)}</div>
                  <div className="mt-1 text-sm text-white/80">
                    Ориентировочно {fmtDur(totals.mins || 0)}
                  </div>
                </div>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Услуг выбрано</span>
                      <span className="font-medium text-white">{selected.size}</span>
                    </div>
                    <div className="flex items-start justify-between text-white/70">
                      <span>Авто</span>
                      <span className="text-right font-medium text-white">
                        <CarIcon className="mr-1 inline h-4 w-4" />
                        {brandName} {modelName}
                        <div className="text-xs font-normal text-white/60">
                          {year}
                          {currentMod?.body_code ? ` · ${currentMod.body_code}` : ""}
                          {currentMod?.displacement_cc ? ` · ${currentMod.displacement_cc} cc` : ""}
                          {currentMod?.horsepower ? ` · ${currentMod.horsepower} л.с.` : ""}
                        </div>
                      </span>
                    </div>
                    {dbBrand && (
                      <div className="flex justify-between text-white/70">
                        <span>Класс авто</span>
                        <span className="font-medium text-white">
                          {TIER_LABEL[tier]} (×{coeff.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="max-h-60 space-y-1.5 overflow-auto border-t border-white/10 pt-3 text-sm">
                    {services
                      .filter((s) => selected.has(s.id))
                      .map((s) => (
                        <div key={s.id} className="flex justify-between gap-2 text-white/70">
                          <span className="truncate">{s.name}</span>
                          <span className="whitespace-nowrap font-medium text-white">
                            {fmt(priceOf(s.id, s.base_price))}
                          </span>
                        </div>
                      ))}
                    {customServices.items
                      .filter((c) => selected.has(customId(c.id)))
                      .map((c) => (
                        <div key={c.id} className="flex justify-between gap-2 text-white/70">
                          <span className="truncate">
                            {c.name}
                            <span className="ml-1 text-[10px] text-blue-300">· для этого авто</span>
                          </span>
                          <span className="whitespace-nowrap font-medium text-white">
                            {fmt(Number(c.price) || 0)}
                          </span>
                        </div>
                      ))}
                  </div>

                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                    size="lg"
                    onClick={async () => {
                      // Собираем обычные услуги
                      const parts: string[] = [];
                      services.forEach((s) => {
                        if (selected.has(s.id))
                          parts.push(`${s.id}:${priceOf(s.id, s.base_price)}`);
                      });
                      // Материализуем «свои» услуги авто — иначе в записи их не будет
                      for (const c of customServices.items) {
                        if (!selected.has(customId(c.id))) continue;
                        try {
                          const svc = await upsertServiceByCategoryName({
                            category: c.category,
                            name: c.name,
                            price: Number(c.price) || 0,
                          });
                          parts.push(`${svc.id}:${Number(c.price) || 0}`);
                        } catch (e) {
                          console.warn("materialize custom failed", e);
                        }
                      }
                      navigate({
                        to: "/calendar",
                        search: {
                          services: parts.join(","),
                          brand: brandId || undefined,
                          carId: carId || undefined,
                        },
                      });
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" /> Записаться на сервис
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => setPrinting(true)}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Печать работ
                  </Button>
                  <p className="text-center text-xs text-white/50">
                    Итоговая цена уточняется после диагностики
                  </p>
                </CardContent>
              </Card>

              <div>
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Назад
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/40 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-white/50">
          © Samson Auto · Автосервис полного цикла
        </div>
      </footer>

      {printing && (() => {
        const works: { name: string; price: number }[] = [];
        services.forEach((s) => {
          if (selected.has(s.id)) works.push({ name: s.name, price: priceOf(s.id, s.base_price) });
        });
        customServices.items.forEach((c) => {
          if (selected.has(customId(c.id))) works.push({ name: c.name, price: Number(c.price) || 0 });
        });
        const carRows: PrintKV[] = [];
        if (brandName) carRows.push({ label: "Марка / модель", value: `${brandName} ${modelName}`.trim() });
        if (year) carRows.push({ label: "Год", value: String(year) });
        if (currentMod) {
          const specs = [
            currentMod.body_code,
            currentMod.engine_code,
            currentMod.displacement_cc ? `${currentMod.displacement_cc} cc` : "",
            currentMod.horsepower ? `${currentMod.horsepower} л.с.` : "",
            currentMod.fuel ?? "",
          ].filter(Boolean).join(" · ");
          if (specs) carRows.push({ label: "Модификация", value: specs });
        }
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        return (
          <PrintDocument
            onDone={() => setPrinting(false)}
            title="Предварительный расчёт"
            meta={[{ label: "Дата", value: `${dd}.${mm}.${now.getFullYear()}` }]}
            sections={carRows.length ? [{ title: "Автомобиль", rows: carRows }] : []}
            works={works}
            total={totals.sum}
          />
        );
      })()}
    </div>
  );
}
