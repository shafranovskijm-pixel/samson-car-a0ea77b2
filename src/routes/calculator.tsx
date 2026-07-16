import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listBrands, listCarModels, listServices, listPricesForBrand } from "@/lib/api";

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

// 9 канонических категорий как у крупных автосервисов
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

function LandingPage() {
  
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });

  const [brandId, setBrandId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  // Итоговая цена: приоритет — ручное переопределение по марке, иначе базовая × коэффициент класса
  const priceOf = (id: string, base: number) => {
    if (brandId && brandPrices[id] != null) return brandPrices[id];
    if (brandId) return Math.round((base * coeff) / 50) * 50; // округление до 50 ₽
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

  return (
    <div className="min-h-full bg-[#0a0a0f] text-white">
      {/* CALCULATOR */}
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
          <div className="mb-10 text-center">
            <Badge className="mb-3 border-orange-500/40 bg-orange-500/10 text-orange-300">
              Калькулятор
            </Badge>
            <h2 className="text-4xl font-bold md:text-5xl">
              Рассчитайте стоимость{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                за минуту
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/60">
              Выберите марку авто и нужные услуги — итоговая цена и время работ обновятся мгновенно.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* SERVICES */}
            <div className="space-y-6">
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
                        Модель {models.length > 0 && (
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

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-red-500/15 px-2 py-1 text-red-300">
                          Класс: {TIER_LABEL[tier]}
                        </span>
                        <span className="text-white/50">
                          Коэффициент × {coeff.toFixed(2)}
                        </span>
                        {currentModel && currentModel.tier && currentBrand?.tier && currentModel.tier !== currentBrand.tier && (
                          <span className="rounded bg-orange-500/15 px-2 py-1 text-orange-300">
                            Класс модели отличается от марки
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* CATEGORY GRID or SERVICES LIST */}
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
                      const overridden = brandId && brandPrices[s.id] != null;
                      const scaled = brandId && !overridden && coeff !== 1;
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
                                {overridden && (
                                  <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] uppercase text-orange-300">
                                    цена по марке
                                  </span>
                                )}
                                {scaled && (
                                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] uppercase text-red-300">
                                    ×{coeff.toFixed(2)} · {TIER_LABEL[tier]}
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex items-baseline gap-2">
                                <div className="text-lg font-bold text-white">
                                  {fmt(price)}
                                </div>
                                {brandId && price !== s.base_price && (
                                  <div className="text-xs text-white/40 line-through">
                                    {fmt(s.base_price)}
                                  </div>
                                )}
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
            </div>

            {/* TOTAL */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
                  <div className="text-xs uppercase tracking-wider text-white/80">
                    Ваш заказ
                  </div>
                  <div className="mt-1 text-3xl font-bold text-white">{fmt(totals.sum)}</div>
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
                      <span className="font-medium text-white text-right">
                        {currentBrand?.name ?? "—"}
                        {currentModel ? ` ${currentModel.name}` : ""}
                      </span>
                    </div>
                    {brandId && (
                      <div className="flex justify-between text-white/70">
                        <span>Класс авто</span>
                        <span className="font-medium text-white">
                          {TIER_LABEL[tier]} (×{coeff.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>
                  {selected.size > 0 && (
                    <div className="max-h-40 space-y-1.5 overflow-auto border-t border-white/10 pt-3 text-xs">
                      {services.filter((s) => selected.has(s.id)).map((s) => (
                        <div key={s.id} className="flex justify-between gap-2 text-white/70">
                          <span className="truncate">{s.name}</span>
                          <span className="whitespace-nowrap font-medium text-white">
                            {fmt(priceOf(s.id, s.base_price))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                    size="lg"
                    asChild
                  >
                    <Link to="/calendar">
                      <CalendarIcon className="mr-2 h-4 w-4" /> Записаться на сервис
                    </Link>
                  </Button>
                  <p className="text-center text-xs text-white/50">
                    Итоговая цена уточняется после диагностики
                  </p>
                </CardContent>
              </Card>

              <Card className="mt-4 border-white/10 bg-white/5 backdrop-blur">
                <CardContent className="space-y-3 p-6 text-sm">
                  <div className="flex items-center gap-3 text-white/80">
                    <Phone className="h-4 w-4 text-red-400" />
                    <span>+7 (800) 555-35-35</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>Москва, ул. Автозаводская, 23</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <Clock className="h-4 w-4 text-red-400" />
                    <span>Ежедневно, 09:00 — 21:00</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/40 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-white/50">
          © Samson Auto · Автосервис полного цикла
        </div>
      </footer>
    </div>
  );
}
