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
export type ClientCategory =
  | "regular"
  | "vip"
  | "new"
  | "problem"
  | "corporate"
  | "friend";

export const CLIENT_CATEGORY_ORDER: ClientCategory[] = [
  "regular",
  "vip",
  "new",
  "problem",
  "corporate",
  "friend",
];

export const CLIENT_CATEGORY_LABELS: Record<ClientCategory, string> = {
  regular: "Обычный",
  vip: "VIP",
  new: "Новый",
  problem: "Проблемный",
  corporate: "Корпоративный",
  friend: "Друг / знакомый",
};

// Tailwind-совместимые классы для аватара категории (bg + border/ring)
export const CLIENT_CATEGORY_COLORS: Record<ClientCategory, string> = {
  regular: "bg-slate-500",
  vip: "bg-amber-500",
  new: "bg-emerald-500",
  problem: "bg-red-500",
  corporate: "bg-blue-600",
  friend: "bg-pink-500",
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
  is_archived?: boolean;
  category?: ClientCategory | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom_fields?: any;
};

export type ClientComment = {
  id: string;
  client_id: string;
  body: string;
  created_at: string;
  updated_at: string;
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
  default_payout_percent?: number;
  payout_percent_since?: string | null;
};
export type MechanicServiceRate = {
  id: string;
  mechanic_id: string;
  service_id: string;
  amount: number;
};
export type MechanicShift = {
  id: string;
  mechanic_id: string;
  starts_at: string;
  ends_at: string;
  note: string | null;
};
export type AppointmentStatus = "scheduled" | "in_progress" | "done" | "cancelled";
export type PaymentStatus = "paid" | "prepaid" | "partial" | "unpaid";
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
  payment_status: PaymentStatus;
  paid_amount: number;
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

export const STATUS_CYCLE: AppointmentStatus[] = [
  "scheduled",
  "in_progress",
  "done",
  "cancelled",
];

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "Оплачено",
  prepaid: "Предоплата",
  partial: "Частично",
  unpaid: "Не оплачен",
};

export const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-800 border-green-300",
  prepaid: "bg-amber-100 text-amber-800 border-amber-300",
  partial: "bg-amber-100 text-amber-800 border-amber-300",
  unpaid: "bg-red-100 text-red-800 border-red-300",
};

export const PAYMENT_CYCLE: PaymentStatus[] = ["unpaid", "prepaid", "partial", "paid"];


export type ReminderInterval = "day" | "week" | "month" | "half_year" | "year" | "custom";
export const REMINDER_INTERVAL_LABELS: Record<ReminderInterval, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
  half_year: "Полгода",
  year: "Год",
  custom: "Произвольно",
};
export type ClientReminder = {
  id: string;
  client_id: string;
  title: string;
  note: string | null;
  remind_at: string;
  interval_kind: ReminderInterval;
  repeat: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
};

