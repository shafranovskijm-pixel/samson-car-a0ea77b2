import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  Brand,
  Car,
  CarModel,
  Client,
  ClientComment,
  ClientReminder,
  Mechanic,
  MechanicServiceRate,
  MechanicShift,
  Service,
} from "./types";


export function humanizeSupabaseError(e: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = e as any;
  const code = err?.code ?? err?.status;
  const msg = String(err?.message ?? err ?? "");
  if (code === "23505" || /duplicate key|already exists/i.test(msg)) {
    return "Такая услуга уже есть";
  }
  if (/no unique or exclusion constraint matching the ON CONFLICT specification/i.test(msg)) {
    return "Не удалось обновить уже сохранённую услугу. Обновите страницу и попробуйте ещё раз";
  }
  if (code === "42501" || code === "PGRST301" || code === 401 || code === 403) {
    return "Нет доступа для этого действия";
  }
  if (/network|fetch|failed to fetch/i.test(msg)) {
    return "Нет соединения. Проверьте интернет";
  }
  return msg || "Не удалось выполнить действие";
}


const throwIf = <T,>(x: { data: T | null; error: unknown }): T => {
  if (x.error) throw x.error;
  return x.data as T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anySb = supabase as any;

const normalizeCategoryKey = (value?: string | null) =>
  (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");

const cleanCategoryName = (value?: string | null) => {
  const clean = (value ?? "").trim().replace(/\s+/g, " ");
  return normalizeCategoryKey(clean) === normalizeCategoryKey("Прочие услуги")
    ? "Прочие услуги"
    : clean;
};

const cleanServiceName = (value: string) => value.trim().replace(/\s+/g, " ");


// BRANDS
export type BrandRow = Brand & { logo_url?: string | null };
export const listBrands = async (): Promise<BrandRow[]> =>
  throwIf(await supabase.from("brands").select("*").order("name"));
export const createBrand = async (name: string) =>
  throwIf(await supabase.from("brands").insert({ name }).select().single());
export const updateBrand = async (id: string, name: string) =>
  throwIf(await supabase.from("brands").update({ name }).eq("id", id).select().single());
export const updateBrandLogo = async (id: string, logo_url: string | null) =>
  throwIf(await supabase.from("brands").update({ logo_url }).eq("id", id).select().single());
export const deleteBrand = async (id: string) => {
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw error;
};

// SERVICE CATEGORIES
export type ServiceCategory = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
};
export const listServiceCategories = async (): Promise<ServiceCategory[]> =>
  throwIf(
    await supabase
      .from("service_categories")
      .select("id, name, image_url, sort_order")
      .order("sort_order")
      .order("name"),
  ) as ServiceCategory[];
export const createServiceCategory = async (input: {
  name: string;
  image_url?: string | null;
  sort_order?: number;
}) =>
  throwIf(
    await supabase
      .from("service_categories")
      .insert({
        name: cleanCategoryName(input.name),
        image_url: input.image_url ?? null,
        sort_order: input.sort_order ?? 100,
      })
      .select()
      .single(),
  );
export const updateServiceCategory = async (
  id: string,
  input: Partial<{ name: string; image_url: string | null; sort_order: number }>,
) =>
  throwIf(
    await supabase
      .from("service_categories")
      .update({ ...input, ...(input.name != null ? { name: cleanCategoryName(input.name) } : {}) })
      .eq("id", id)
      .select()
      .single(),
  );
export const deleteServiceCategory = async (id: string, fallbackName = "Прочие услуги") => {
  const { data: category, error: categoryError } = await supabase
    .from("service_categories")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (categoryError) throw categoryError;

  const fallbackCategory = cleanCategoryName(fallbackName);
  const targetKey = normalizeCategoryKey((category as { name?: string } | null)?.name);
  const fallbackKey = normalizeCategoryKey(fallbackCategory);

  if (targetKey && targetKey !== fallbackKey) {
    const { data: rowsData, error: rowsError } = await supabase
      .from("services")
      .select("id, category")
      .is("deleted_at", null);
    if (rowsError) throw rowsError;

    const rows = (rowsData ?? []) as Array<{ id: string; category: string | null }>;
    const ids = rows
      .filter((row) => normalizeCategoryKey(row.category) === targetKey)
      .map((row) => row.id);

    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { error: updateError } = await supabase
        .from("services")
        .update({ category: fallbackCategory })
        .in("id", chunk);
      if (updateError) throw updateError;
    }
  }

  const { error } = await supabase.from("service_categories").delete().eq("id", id);
  if (error) throw error;
};

// CATALOG-IMAGES STORAGE
export const uploadCatalogImage = async (file: File, prefix: string): Promise<string> => {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("catalog-images")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
  return data.publicUrl;
};

// CAR MODELS
export const listCarModels = async (brand_id?: string): Promise<CarModel[]> => {
  let q = supabase.from("car_models").select("*").order("name");
  if (brand_id) q = q.eq("brand_id", brand_id);
  return throwIf(await q) as CarModel[];
};
export const createCarModel = async (input: { brand_id: string; name: string; tier: string | null }) =>
  throwIf(await supabase.from("car_models").insert(input).select().single());
export const updateCarModel = async (
  id: string,
  input: Partial<{ name: string; tier: string | null }>,
) => throwIf(await supabase.from("car_models").update(input).eq("id", id).select().single());
export const deleteCarModel = async (id: string) => {
  const { error } = await supabase.from("car_models").delete().eq("id", id);
  if (error) throw error;
};

export const listServices = async (): Promise<Service[]> =>
  throwIf(await supabase.from("services").select("*").order("category").order("name"));
export const createService = async (
  input: Omit<Service, "id">,
) => throwIf(await supabase.from("services").insert(input).select().single());
export const updateService = async (id: string, input: Partial<Omit<Service, "id">>) =>
  throwIf(await supabase.from("services").update(input).eq("id", id).select().single());
export const deleteService = async (id: string) => {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
};

// Найти или создать услугу по (категория, название). Используется для «ручных» услуг.
export const upsertServiceByCategoryName = async (input: {
  category: string;
  name: string;
  price: number;
  duration_minutes?: number;
}): Promise<Service> => {
  const category = cleanCategoryName(input.category);
  const name = cleanServiceName(input.name);
  const { data: matches, error: findErr } = await supabase
    .from("services")
    .select("*")
    .ilike("name", name)
    .is("deleted_at", null);
  if (findErr) throw findErr;
  const existing = ((matches ?? []) as Service[]).find(
    (service) =>
      normalizeCategoryKey(service.category) === normalizeCategoryKey(category) &&
      cleanServiceName(service.name).toLocaleLowerCase("ru-RU") ===
        name.toLocaleLowerCase("ru-RU"),
  );
  if (existing) return existing as Service;
  const { data, error } = await supabase
    .from("services")
    .insert({
      category,
      name,
      base_price: input.price,
      duration_minutes: input.duration_minutes ?? 30,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Service;
};

// SERVICE PRICES (brand overrides)
export const listServicePrices = async (
  serviceId: string,
): Promise<{ service_id: string; brand_id: string; price: number }[]> =>
  throwIf(await supabase.from("service_prices").select("*").eq("service_id", serviceId));
export const upsertServicePrice = async (service_id: string, brand_id: string, price: number) =>
  throwIf(
    await supabase
      .from("service_prices")
      .upsert({ service_id, brand_id, price })
      .select()
      .single(),
  );
export const deleteServicePrice = async (service_id: string, brand_id: string) => {
  const { error } = await supabase
    .from("service_prices")
    .delete()
    .eq("service_id", service_id)
    .eq("brand_id", brand_id);
  if (error) throw error;
};
export const getPriceForBrand = async (service_id: string, brand_id: string | null) => {
  if (!brand_id) return null;
  const { data } = await supabase
    .from("service_prices")
    .select("price")
    .eq("service_id", service_id)
    .eq("brand_id", brand_id)
    .maybeSingle();
  return data?.price ?? null;
};
export const listPricesForBrand = async (
  brand_id: string,
): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from("service_prices")
    .select("service_id, price")
    .eq("brand_id", brand_id);
  if (error) throw error;
  const map: Record<string, number> = {};
  (data ?? []).forEach((r) => (map[r.service_id as string] = r.price as number));
  return map;
};


// CLIENTS
export const listClients = async (): Promise<Client[]> =>
  throwIf(await supabase.from("clients").select("*").order("full_name"));
export const createClient = async (input: Omit<Client, "id">) =>
  throwIf(await supabase.from("clients").insert(input).select().single());
export const updateClient = async (id: string, input: Partial<Omit<Client, "id">>) =>
  throwIf(await supabase.from("clients").update(input).eq("id", id).select().single());
export const deleteClient = async (id: string) => {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
};

// CARS
export const listCars = async (): Promise<Car[]> =>
  throwIf(await supabase.from("cars").select("*").order("created_at", { ascending: false }));
export const listCarsByClient = async (client_id: string): Promise<Car[]> =>
  throwIf(await supabase.from("cars").select("*").eq("client_id", client_id));
export const createCar = async (input: Omit<Car, "id">) =>
  throwIf(await supabase.from("cars").insert(input).select().single());
export const updateCar = async (id: string, input: Partial<Omit<Car, "id">>) =>
  throwIf(await supabase.from("cars").update(input).eq("id", id).select().single());
export const deleteCar = async (id: string) => {
  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) throw error;
};

// MECHANICS
export const listMechanics = async (): Promise<Mechanic[]> =>
  throwIf(await supabase.from("mechanics").select("*").order("full_name"));
export const createMechanic = async (input: Omit<Mechanic, "id">) =>
  throwIf(await supabase.from("mechanics").insert(input).select().single());
export const updateMechanic = async (id: string, input: Partial<Omit<Mechanic, "id">>) =>
  throwIf(await supabase.from("mechanics").update(input).eq("id", id).select().single());
export const deleteMechanic = async (id: string) => {
  const { error } = await supabase.from("mechanics").delete().eq("id", id);
  if (error) throw error;
};

// APPOINTMENTS
export type AppointmentWithRelations = Appointment & {
  car: (Car & { brand: Brand | null; client: Client }) | null;
  mechanic: Mechanic | null;
  services: {
    service_id: string;
    price: number;
    mechanic_payout: number;
    service: Service | null;
  }[];
};

const APPT_SELECT = `
  *,
  car:cars(*, brand:brands(*), client:clients(*)),
  mechanic:mechanics(*),
  services:appointment_services(service_id, price, mechanic_payout, service:services(*))
`;

export const listAppointments = async (
  from?: Date,
  to?: Date,
): Promise<AppointmentWithRelations[]> => {
  let q = supabase.from("appointments").select(APPT_SELECT).order("starts_at");
  if (from) q = q.gte("starts_at", from.toISOString());
  if (to) q = q.lte("starts_at", to.toISOString());
  return throwIf(await q) as AppointmentWithRelations[];
};

export const getAppointment = async (id: string): Promise<AppointmentWithRelations> =>
  throwIf(await supabase.from("appointments").select(APPT_SELECT).eq("id", id).single()) as AppointmentWithRelations;

type ApptServiceInput = { service_id: string; price: number; mechanic_payout: number };

export const createAppointment = async (input: {
  car_id: string;
  mechanic_id: string | null;
  starts_at: string;
  duration_minutes: number;
  status: string;
  mileage: number | null;
  comment: string | null;
  services: ApptServiceInput[];
}) => {
  const { services, ...appt } = input;
  const created = throwIf(
    await supabase.from("appointments").insert(appt).select().single(),
  ) as { id: string };
  if (services.length > 0) {
    const { error } = await supabase
      .from("appointment_services")
      .insert(services.map((s) => ({ ...s, appointment_id: created.id })));
    if (error) throw error;
  }
  return created;
};

export const updateAppointment = async (
  id: string,
  input: {
    car_id: string;
    mechanic_id: string | null;
    starts_at: string;
    duration_minutes: number;
    status: string;
    mileage: number | null;
    comment: string | null;
    services: ApptServiceInput[];
  },
) => {
  const { services, ...appt } = input;
  throwIf(await supabase.from("appointments").update(appt).eq("id", id).select().single());
  const { error: delErr } = await supabase
    .from("appointment_services")
    .delete()
    .eq("appointment_id", id);
  if (delErr) throw delErr;
  if (services.length > 0) {
    const { error } = await supabase
      .from("appointment_services")
      .insert(services.map((s) => ({ ...s, appointment_id: id })));
    if (error) throw error;
  }
};


export const deleteAppointment = async (id: string) => {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw error;
};

export const updateAppointmentPayment = async (
  id: string,
  patch: { payment_status: string; paid_amount: number },
) => {
  const { error } = await supabase.from("appointments").update(patch).eq("id", id);
  if (error) throw error;
};

// APPOINTMENTS by client (история клиента)
export const listAppointmentsByClient = async (
  client_id: string,
): Promise<AppointmentWithRelations[]> => {
  const carsRes = await supabase.from("cars").select("id").eq("client_id", client_id);
  if (carsRes.error) throw carsRes.error;
  const ids = (carsRes.data ?? []).map((c) => c.id as string);
  if (ids.length === 0) return [];
  return throwIf(
    await supabase
      .from("appointments")
      .select(APPT_SELECT)
      .in("car_id", ids)
      .order("starts_at", { ascending: false }),
  ) as AppointmentWithRelations[];
};

// CLIENT COMMENTS
export const listClientComments = async (client_id: string): Promise<ClientComment[]> => {
  const { data, error } = await anySb
    .from("client_comments")
    .select("*")
    .eq("client_id", client_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientComment[];
};

export const listAllClientComments = async (): Promise<ClientComment[]> => {
  const { data, error } = await anySb
    .from("client_comments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientComment[];
};

export const createClientComment = async (client_id: string, body: string) => {
  const { data, error } = await anySb
    .from("client_comments")
    .insert({ client_id, body })
    .select()
    .single();
  if (error) throw error;
  return data as ClientComment;
};

export const updateClientComment = async (id: string, body: string) => {
  const { data, error } = await anySb
    .from("client_comments")
    .update({ body })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ClientComment;
};

export const deleteClientComment = async (id: string) => {
  const { error } = await anySb.from("client_comments").delete().eq("id", id);
  if (error) throw error;
};


// CLIENT REMINDERS
export const listClientReminders = async (client_id: string): Promise<ClientReminder[]> =>
  throwIf(
    await supabase
      .from("client_reminders")
      .select("*")
      .eq("client_id", client_id)
      .order("remind_at", { ascending: true }),
  ) as ClientReminder[];

export const createClientReminder = async (
  input: Omit<ClientReminder, "id" | "created_at" | "updated_at" | "done_at"> & {
    done_at?: string | null;
  },
) =>
  throwIf(
    await supabase.from("client_reminders").insert(input).select().single(),
  ) as ClientReminder;

export const updateClientReminder = async (
  id: string,
  input: Partial<Omit<ClientReminder, "id" | "client_id" | "created_at" | "updated_at">>,
) =>
  throwIf(
    await supabase.from("client_reminders").update(input).eq("id", id).select().single(),
  ) as ClientReminder;

export const deleteClientReminder = async (id: string) => {
  const { error } = await supabase.from("client_reminders").delete().eq("id", id);
  if (error) throw error;
};

// Добавить к дате интервал (день/неделя/месяц/полгода/год)
export const addReminderInterval = (
  base: Date,
  kind: "day" | "week" | "month" | "half_year" | "year",
): Date => {
  const d = new Date(base);
  switch (kind) {
    case "day":
      d.setDate(d.getDate() + 1);
      break;
    case "week":
      d.setDate(d.getDate() + 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + 1);
      break;
    case "half_year":
      d.setMonth(d.getMonth() + 6);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
};


// MECHANIC SERVICE RATES
export const listMechanicServiceRates = async (
  mechanic_id?: string,
): Promise<MechanicServiceRate[]> => {
  let q = supabase.from("mechanic_service_rates").select("*");
  if (mechanic_id) q = q.eq("mechanic_id", mechanic_id);
  return throwIf(await q) as MechanicServiceRate[];
};

export const upsertMechanicServiceRate = async (
  mechanic_id: string,
  service_id: string,
  amount: number,
) =>
  throwIf(
    await supabase
      .from("mechanic_service_rates")
      .upsert({ mechanic_id, service_id, amount }, { onConflict: "mechanic_id,service_id" })
      .select()
      .single(),
  ) as MechanicServiceRate;

export const deleteMechanicServiceRate = async (mechanic_id: string, service_id: string) => {
  const { error } = await supabase
    .from("mechanic_service_rates")
    .delete()
    .eq("mechanic_id", mechanic_id)
    .eq("service_id", service_id);
  if (error) throw error;
};

// MECHANIC SHIFTS
export const listMechanicShifts = async (mechanic_id: string): Promise<MechanicShift[]> =>
  throwIf(
    await supabase
      .from("mechanic_shifts")
      .select("*")
      .eq("mechanic_id", mechanic_id)
      .order("starts_at", { ascending: false }),
  ) as MechanicShift[];

export const listAllMechanicShifts = async (): Promise<MechanicShift[]> =>
  throwIf(
    await supabase.from("mechanic_shifts").select("*").order("starts_at", { ascending: true }),
  ) as MechanicShift[];

export const createMechanicShift = async (input: Omit<MechanicShift, "id">) =>
  throwIf(await supabase.from("mechanic_shifts").insert(input).select().single()) as MechanicShift;

export const updateMechanicShift = async (
  id: string,
  input: Partial<Omit<MechanicShift, "id" | "mechanic_id">>,
) =>
  throwIf(
    await supabase.from("mechanic_shifts").update(input).eq("id", id).select().single(),
  ) as MechanicShift;

export const deleteMechanicShift = async (id: string) => {
  const { error } = await supabase.from("mechanic_shifts").delete().eq("id", id);
  if (error) throw error;
};

// MECHANIC PAYOUTS (для расчёта ЗП)
export type MechanicPayoutRow = {
  appointment_id: string;
  service_id: string;
  price: number;
  mechanic_payout: number;
  starts_at: string;
  status: string;
  service_name: string | null;
  client_name: string | null;
  car_label: string | null;
  license_plate: string | null;
  appointment_comment: string | null;
};

export const listMechanicPayouts = async (
  mechanic_id: string,
): Promise<MechanicPayoutRow[]> => {
  const { data, error } = await supabase
    .from("appointment_services")
    .select(
      "appointment_id, service_id, price, mechanic_payout, service:services(name), appointment:appointments!inner(starts_at, status, mechanic_id, comment, car:cars(model, license_plate, brand:brands(name), client:clients(full_name)))",
    )
    .eq("appointment.mechanic_id", mechanic_id);
  if (error) throw error;
  type Row = {
    appointment_id: string;
    service_id: string;
    price: number;
    mechanic_payout: number;
    service: { name: string } | null;
    appointment: {
      starts_at: string;
      status: string;
      comment: string | null;
      car: {
        model: string | null;
        license_plate: string | null;
        brand: { name: string } | null;
        client: { full_name: string } | null;
      } | null;
    } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const car = r.appointment?.car;
    const brand = car?.brand?.name ?? "";
    const model = car?.model ?? "";
    const carLabel = [brand, model].filter(Boolean).join(" ") || null;
    return {
      appointment_id: r.appointment_id,
      service_id: r.service_id,
      price: Number(r.price),
      mechanic_payout: Number(r.mechanic_payout),
      starts_at: r.appointment?.starts_at ?? "",
      status: r.appointment?.status ?? "",
      service_name: r.service?.name ?? null,
      client_name: car?.client?.full_name ?? null,
      car_label: carLabel,
      license_plate: car?.license_plate ?? null,
      appointment_comment: r.appointment?.comment ?? null,
    };
  });
};

export const updateMechanicDefaultPayoutPercent = async (id: string, percent: number) => {
  const { error } = await anySb
    .from("mechanics")
    .update({ default_payout_percent: percent })
    .eq("id", id);
  if (error) throw error;
};

// EXPENSES
export type Expense = {
  id: string;
  spent_at: string;
  amount: number;
  title: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export const listExpenses = async (from?: string, to?: string): Promise<Expense[]> => {
  let q = anySb.from("expenses").select("*").order("spent_at", { ascending: false });
  if (from) q = q.gte("spent_at", from);
  if (to) q = q.lte("spent_at", to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Expense[];
};

export const createExpense = async (
  input: { spent_at: string; amount: number; title: string; note: string | null },
): Promise<Expense> => {
  const { data, error } = await anySb.from("expenses").insert(input).select().single();
  if (error) throw error;
  return data as Expense;
};

export const updateExpense = async (
  id: string,
  input: Partial<{ spent_at: string; amount: number; title: string; note: string | null }>,
): Promise<Expense> => {
  const { data, error } = await anySb.from("expenses").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Expense;
};

export const deleteExpense = async (id: string) => {
  const { error } = await anySb.from("expenses").delete().eq("id", id);
  if (error) throw error;
};

// MECHANIC ADVANCES
export type MechanicAdvance = {
  id: string;
  mechanic_id: string;
  paid_at: string;
  amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export const listMechanicAdvances = async (
  opts: { mechanic_id?: string; from?: string; to?: string } = {},
): Promise<MechanicAdvance[]> => {
  let q = anySb.from("mechanic_advances").select("*").order("paid_at", { ascending: false });
  if (opts.mechanic_id) q = q.eq("mechanic_id", opts.mechanic_id);
  if (opts.from) q = q.gte("paid_at", opts.from);
  if (opts.to) q = q.lte("paid_at", opts.to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MechanicAdvance[];
};

export const createMechanicAdvance = async (
  input: { mechanic_id: string; paid_at: string; amount: number; note: string | null },
): Promise<MechanicAdvance> => {
  const { data, error } = await anySb.from("mechanic_advances").insert(input).select().single();
  if (error) throw error;
  return data as MechanicAdvance;
};

export const deleteMechanicAdvance = async (id: string) => {
  const { error } = await anySb.from("mechanic_advances").delete().eq("id", id);
  if (error) throw error;
};

// SERVICE DEFAULT PAYOUT %
export const updateServiceDefaultPayoutPercent = async (id: string, percent: number) => {
  const { error } = await anySb
    .from("services")
    .update({ default_payout_percent: percent })
    .eq("id", id);
  if (error) throw error;
};

// APPOINTMENT PAYMENTS (журнал платежей клиента)
export type AppointmentPayment = {
  id: string;
  appointment_id: string;
  paid_at: string; // YYYY-MM-DD
  amount: number;
  method: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export const listAppointmentPayments = async (
  appointment_id: string,
): Promise<AppointmentPayment[]> => {
  const { data, error } = await anySb
    .from("appointment_payments")
    .select("*")
    .eq("appointment_id", appointment_id)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppointmentPayment[];
};

export const createAppointmentPayment = async (input: {
  appointment_id: string;
  paid_at: string;
  amount: number;
  method?: string | null;
  note?: string | null;
}): Promise<AppointmentPayment> => {
  const { data, error } = await anySb
    .from("appointment_payments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as AppointmentPayment;
};

export const deleteAppointmentPayment = async (id: string) => {
  const { error } = await anySb.from("appointment_payments").delete().eq("id", id);
  if (error) throw error;
};

export const clearAppointmentPayments = async (appointment_id: string) => {
  const { error } = await anySb
    .from("appointment_payments")
    .delete()
    .eq("appointment_id", appointment_id);
  if (error) throw error;
};

// Сумма платежей за диапазон дат (по фактической дате оплаты).
export const listPaymentsRange = async (
  from: string,
  to: string,
): Promise<AppointmentPayment[]> => {
  const { data, error } = await anySb
    .from("appointment_payments")
    .select("*")
    .gte("paid_at", from)
    .lte("paid_at", to)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppointmentPayment[];
};

