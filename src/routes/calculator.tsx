import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listBrands,
  listCarModels,
  listServices,
  listPricesForBrand,
  createCarModel,
} from "@/lib/api";

import { TIER_COEFFICIENT, TIER_LABEL, resolveTier, type BrandTier } from "@/lib/types";
import imgFluids from "@/assets/cat-fluids.jpg";
import imgEngine from "@/assets/cat-engine.jpg";
import imgFuel from "@/assets/cat-fuel.jpg";
import imgSuspension from "@/assets/cat-suspension.jpg";
import imgAlignment from "@/assets/cat-alignment.jpg";
import imgBrakes from "@/assets/cat-brakes.jpg";
import imgAc from "@/assets/cat-ac.jpg";
import imgTires from "@/assets/cat-tires.jpg";
import imgElectric from "@/assets/cat-electric.jpg";


export const Route = createFileRoute("/calculator")({
  ssr: false,
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

const CATEGORIES: { name: string; img: string }[] = [
  { name: "Жидкости и фильтры", img: imgFluids },
  { name: "Двигатель и навесное оборудование", img: imgEngine },
  { name: "Топливная система", img: imgFuel },
  { name: "Ходовая часть и рулевое управление", img: imgSuspension },
  { name: "Регулировочные работы", img: imgAlignment },
  { name: "Тормозная система", img: imgBrakes },
  { name: "Кондиционер и отопление", img: imgAc },
  { name: "Шиномонтажные работы", img: imgTires },
  { name: "Электрика и электроника", img: imgElectric },
];

type Step = 1 | 2 | 3;

function LandingPage() {
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });

  const [step, setStep] = useState<Step>(1);
  const [brandId, setBrandId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [newModelName, setNewModelName] = useState("");
  const qc = useQueryClient();

  const addModelMut = useMutation({
    mutationFn: async (name: string) => {
      if (!brandId) throw new Error("Сначала выберите марку");
      return createCarModel({ brand_id: brandId, name: name.trim(), tier: null });
    },
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ["car-models", brandId] });
      setModelId((m as unknown as { id: string }).id);
      setNewModelName("");
      toast.success("Модель добавлена");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Не удалось добавить модель"),
  });

  const { data: brandPrices = {} } = useQuery({
    queryKey: ["brand-prices", brandId],
    queryFn: () => listPricesForBrand(brandId),
    enabled: !!brandId,
  });

  const { data: models = [] } = useQuery({
    queryKey: ["car-models", brandId],
    queryFn: () => listCarModels(brandId),
    enabled: !!brandId,
  });

  const currentBrand = useMemo(() => brands.find((b) => b.id === brandId), [brands, brandId]);
  const currentModel = useMemo(() => models.find((m) => m.id === modelId), [models, modelId]);
  const tier: BrandTier = resolveTier(currentBrand, currentModel);
  const coeff = TIER_COEFFICIENT[tier];

  const priceOf = (id: string, base: number) => {
    if (brandId && brandPrices[id] != null) return brandPrices[id];
    if (brandId) return Math.round((base * coeff) / 50) * 50;
    return base;
  };

  const byCategory = useMemo(() => {
    const map: Record<string, typeof services> = {};
    services.forEach((s) => {
      (map[s.category] ??= []).push(s);
    });
    return map;
  }, [services]);

  const totals = useMemo(() => {
    let sum = 0;
    let mins = 0;
    services.forEach((s) => {
      if (selected.has(s.id)) {
        sum += priceOf(s.id, s.base_price);
        mins += s.duration_minutes;
      }
    });
    return { sum, mins };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, services, brandPrices, brandId, coeff]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
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

  const goStep = (s: Step) => {
    // разрешаем переход только на пройденный или следующий доступный шаг
    if (s === 1) setStep(1);
    if (s === 2 && selected.size > 0) setStep(2);
    if (s === 3 && selected.size > 0 && brandId) setStep(3);
  };

  const StepBadge = ({ n, label }: { n: Step; label: string }) => {
    const active = step === n;
    const done =
      (n === 1 && step > 1) ||
      (n === 2 && step > 2);
    const reachable =
      n === 1 || (n === 2 && selected.size > 0) || (n === 3 && selected.size > 0 && brandId);
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

  return (
    <div className="min-h-full bg-[#0a0a0f] text-white">
      <section id="calculator" className="relative py-12">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-red-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">
              Рассчитайте стоимость{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                за минуту
              </span>
            </h2>
          </div>


          {/* ШАГ 1 — УСЛУГИ */}
          {step === 1 && (
            <div className="space-y-6">
              {!activeCategory ? (
                <>
                  <div className="mb-2 text-lg font-semibold text-white">
                    Выберите категорию услуг
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {CATEGORIES.map((c) => {
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
                          <img
                            src={c.img}
                            alt={c.name}
                            loading="lazy"
                            width={800}
                            height={512}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
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
                    <img
                      src={CATEGORIES.find((c) => c.name === activeCategory)?.img}
                      alt=""
                      width={80}
                      height={60}
                      className="h-14 w-20 rounded-lg object-cover ring-1 ring-white/10"
                    />
                    <div>
                      <h3 className="text-xl font-bold">{activeCategory}</h3>
                      <div className="text-xs text-white/50">
                        {byCategory[activeCategory]?.length ?? 0} услуг
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(byCategory[activeCategory] ?? []).map((s) => {
                      const active = selected.has(s.id);
                      const price = priceOf(s.id, s.base_price);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggle(s.id)}
                          className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                            active
                              ? "border-red-500/60 bg-gradient-to-br from-red-500/15 to-orange-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_10px_40px_-10px_rgba(239,68,68,0.4)]"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={active}
                              className="mt-1 border-white/30 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-white">{s.name}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {fmtDur(s.duration_minutes)}
                                </span>
                              </div>
                              <div className="mt-3 flex items-baseline gap-2">
                                <div className="text-lg font-bold text-white">{fmt(price)}</div>
                              </div>
                            </div>
                          </div>
                          {active && (
                            <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                          )}
                        </button>
                      );
                    })}
                    {(byCategory[activeCategory]?.length ?? 0) === 0 && (
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

              {/* Липкий футер с итогом и «Далее» */}
              <div className="sticky bottom-4 z-20 mt-8">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur">
                  <div className="text-sm">
                    <div className="text-white/60">Выбрано услуг</div>
                    <div className="text-lg font-bold text-white">
                      {selected.size}{" "}
                      <span className="text-sm font-normal text-white/60">
                        · примерно {fmtDur(totals.mins || 0)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    disabled={selected.size === 0}
                    onClick={() => setStep(2)}
                    className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Далее — выбрать авто <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ШАГ 2 — АВТО */}
          {step === 2 && (
            <div className="mx-auto max-w-2xl space-y-6">
              <Card className="border-white/10 bg-white/5 backdrop-blur">
                <CardContent className="p-6">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                    Марка автомобиля
                  </label>
                  <Select
                    value={brandId}
                    onValueChange={(v) => {
                      setBrandId(v);
                      setModelId("");
                    }}
                  >
                    <SelectTrigger className="h-12 border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Выберите марку — например, Toyota" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                          {b.tier ? (
                            <span className="ml-2 text-xs text-white/50">
                              · {TIER_LABEL[b.tier as BrandTier] ?? ""}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {brandId && (
                    <>
                      <label className="mb-2 mt-4 block text-xs font-medium uppercase tracking-wider text-white/50">
                        Модель{" "}
                        {models.length > 0 && (
                          <span className="ml-1 normal-case text-white/40">
                            ({models.length} в справочнике)
                          </span>
                        )}
                      </label>
                      <Select value={modelId} onValueChange={setModelId}>
                        <SelectTrigger className="h-12 border-white/10 bg-white/5 text-white">
                          <SelectValue
                            placeholder={
                              models.length
                                ? "Выберите модель для точного расчёта"
                                : "У этой марки пока нет моделей в справочнике"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {models.map((m) => {
                            const mt = (m.tier ?? currentBrand?.tier) as BrandTier | undefined;
                            return (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                                {mt ? (
                                  <span className="ml-2 text-xs text-white/50">
                                    · {TIER_LABEL[mt] ?? ""}
                                  </span>
                                ) : null}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      <div className="mt-3 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-3">
                        <div className="mb-2 text-xs text-white/60">
                          Нет вашей модели в списке? Добавьте — сохранится автоматически.
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newModelName.trim()) {
                                e.preventDefault();
                                addModelMut.mutate(newModelName);
                              }
                            }}
                            placeholder="Например, Camry"
                            className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                          />
                          <Button
                            type="button"
                            onClick={() => addModelMut.mutate(newModelName)}
                            disabled={!newModelName.trim() || addModelMut.isPending}
                            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Добавить
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-red-500/15 px-2 py-1 text-red-300">
                          Класс: {TIER_LABEL[tier]}
                        </span>
                        <span className="text-white/50">
                          Коэффициент × {coeff.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Назад
                </Button>
                <Button
                  size="lg"
                  disabled={!brandId}
                  onClick={() => setStep(3)}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Далее — итог <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ШАГ 3 — ИТОГ */}
          {step === 3 && (
            <div className="mx-auto max-w-2xl space-y-4">
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
                    <div className="flex justify-between text-white/70">
                      <span>Авто</span>
                      <span className="text-right font-medium text-white">
                        {currentBrand?.name ?? "—"}
                        {currentModel ? ` ${currentModel.name}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Класс авто</span>
                      <span className="font-medium text-white">
                        {TIER_LABEL[tier]} (×{coeff.toFixed(2)})
                      </span>
                    </div>
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
                  </div>

                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                    size="lg"
                    asChild
                  >
                    <Link
                      to="/calendar"
                      search={{
                        services: services
                          .filter((s) => selected.has(s.id))
                          .map((s) => `${s.id}:${priceOf(s.id, s.base_price)}`)
                          .join(","),
                        brand: brandId || undefined,
                        model: modelId || undefined,
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" /> Записаться на сервис
                    </Link>
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
    </div>
  );
}
