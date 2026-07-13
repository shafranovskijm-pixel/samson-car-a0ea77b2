import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench,
  Calendar as CalendarIcon,
  ShieldCheck,
  Clock,
  Phone,
  MapPin,
  Sparkles,
  Gauge,
  Cog,
  Droplet,
  Disc3,
  Wind,
  Zap,
  Car as CarIcon,
  CheckCircle2,
  ChevronRight,
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
import { listBrands, listServices, listPricesForBrand } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import heroAsset from "@/assets/samson-hero.jpg.asset.json";

export const Route = createFileRoute("/")({
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

const CATEGORY_ICONS: Record<string, typeof Wrench> = {
  Диагностика: Gauge,
  ТО: Cog,
  "Замена масла": Droplet,
  Тормоза: Disc3,
  Подвеска: Wrench,
  Двигатель: Zap,
  Электрика: Zap,
  Кондиционер: Wind,
  Шиномонтаж: CarIcon,
  Кузов: Sparkles,
};

function LandingPage() {
  const { openLogin } = useAuth();
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: listServices });

  const [brandId, setBrandId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: brandPrices = {} } = useQuery({
    queryKey: ["brand-prices", brandId],
    queryFn: () => listPricesForBrand(brandId),
    enabled: !!brandId,
  });

  const priceOf = (id: string, base: number) => brandPrices[id] ?? base;

  const grouped = useMemo(() => {
    const map: Record<string, typeof services> = {};
    services.forEach((s) => {
      (map[s.category] ??= []).push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, "ru"));
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
  }, [selected, services, brandPrices]);

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
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Samson Auto — премиум автосервис"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        {/* red glow blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-red-600/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <Badge className="mb-6 border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20">
            <Sparkles className="mr-1 h-3 w-3" /> Автосервис нового поколения
          </Badge>
          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            SAMSON<span className="text-red-500">.</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-red-700 bg-clip-text text-transparent">
              Сила и точность
            </span>
            <br />
            вашего авто
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">
            Полный цикл обслуживания для любой марки. Рассчитайте стоимость услуг онлайн
            и запишитесь на удобное время.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-red-600 text-white hover:bg-red-700"
              asChild
            >
              <a href="#calculator">
                Калькулятор стоимости <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10"
              asChild
            >
              <Link to="/calendar">
                <CalendarIcon className="mr-2 h-4 w-4" /> Записаться
              </Link>
            </Button>
          </div>

          <div className="mt-16 grid max-w-2xl grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { n: "12+", l: "лет опыта" },
              { n: "40k", l: "довольных клиентов" },
              { n: "60+", l: "видов услуг" },
              { n: "24/7", l: "поддержка" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-bold text-white">{s.n}</div>
                <div className="text-xs uppercase tracking-wider text-white/50">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Гарантия качества", d: "На все работы и запчасти" },
            { icon: Clock, t: "Быстро и в срок", d: "Соблюдаем оговорённое время" },
            { icon: Wrench, t: "Оригинальные запчасти", d: "Работаем с проверенными поставщиками" },
            { icon: Sparkles, t: "Прозрачные цены", d: "Никаких скрытых доплат" },
          ].map((f) => (
            <Card
              key={f.t}
              className="border-white/10 bg-white/5 backdrop-blur transition hover:border-red-500/40 hover:bg-white/10"
            >
              <CardContent className="p-6">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold text-white">{f.t}</div>
                <div className="mt-1 text-sm text-white/60">{f.d}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="relative py-20">
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
                  <Select value={brandId} onValueChange={setBrandId}>
                    <SelectTrigger className="h-12 border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Выберите марку — например, Toyota" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {brandId && (
                    <p className="mt-2 text-xs text-white/50">
                      Цены пересчитаны с учётом марки
                    </p>
                  )}
                </CardContent>
              </Card>

              {grouped.map(([cat, items]) => {
                const Icon = CATEGORY_ICONS[cat] ?? Wrench;
                return (
                  <div key={cat}>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400 ring-1 ring-red-500/30">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-semibold">{cat}</h3>
                      <div className="ml-2 text-xs text-white/40">{items.length} услуг</div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {items.map((s) => {
                        const active = selected.has(s.id);
                        const price = priceOf(s.id, s.base_price);
                        const overridden = brandId && brandPrices[s.id] != null;
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
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-medium text-white">{s.name}</div>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-xs text-white/50">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {fmtDur(s.duration_minutes)}
                                  </span>
                                  {overridden && (
                                    <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] uppercase text-orange-300">
                                      цена по марке
                                    </span>
                                  )}
                                </div>
                                <div className="mt-3 text-lg font-bold text-white">
                                  {fmt(price)}
                                </div>
                              </div>
                            </div>
                            {active && (
                              <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

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
                      <span>Марка</span>
                      <span className="font-medium text-white">
                        {brands.find((b) => b.id === brandId)?.name ?? "—"}
                      </span>
                    </div>
                  </div>
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
