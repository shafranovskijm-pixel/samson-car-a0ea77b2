export type BrandTier = "economy" | "comfort" | "business" | "premium" | "luxury";
export type Brand = { id: string; name: string; tier?: BrandTier | string };
export type CarModel = {
  id: string;
  brand_id: string;
  name: string;
  tier: BrandTier | string | null;
};

export const TIER_COEFFICIENT: Record<BrandTier, number> = {
  economy: 1.0,
  comfort: 1.3,
  business: 1.7,
  premium: 2.2,
  luxury: 3.0,
};
export const TIER_LABEL: Record<BrandTier, string> = {
  economy: "Эконом",
  comfort: "Комфорт",
  business: "Бизнес",
  premium: "Премиум",
  luxury: "Люкс",
};
export const TIER_OPTIONS: BrandTier[] = ["economy", "comfort", "business", "premium", "luxury"];

export const resolveTier = (
  brand?: Brand | null,
  model?: CarModel | null,
): BrandTier => {
  const raw = (model?.tier ?? brand?.tier ?? "economy") as string;
  return (raw in TIER_COEFFICIENT ? raw : "economy") as BrandTier;
};
export type Service = {
  id: string;
  name: string;
  category: string;
  base_price: number;
  duration_minutes: number;
};
export type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address?: string | null;
  birthday?: string | null;
  telegram?: string | null;
  note?: string | null;
  custom_fields?: Record<string, string> | null;
};

export type Car = {
  id: string;
  client_id: string;
  brand_id: string | null;
  model: string;
  year: number | null;
  license_plate: string | null;
  vin: string | null;
  color: string | null;
  engine_volume: number | null;
  engine_power: number | null;
  transmission: string | null;
  drive_type: string | null;
  mileage: number | null;
};
export type Mechanic = {
  id: string;
  full_name: string;
  specialization: string | null;
  phone: string | null;
  color: string;
};
export type AppointmentStatus = "scheduled" | "in_progress" | "done" | "cancelled";
export type Appointment = {
  id: string;
  car_id: string;
  mechanic_id: string | null;
  starts_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  mileage: number | null;
  comment: string | null;
  total_price: number;
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Запланировано",
  in_progress: "В работе",
  done: "Выполнено",
  cancelled: "Отменено",
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  done: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300",
};
