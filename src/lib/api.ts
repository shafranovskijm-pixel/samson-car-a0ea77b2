import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  Brand,
  Car,
  CarModel,
  Client,
  ClientReminder,
  Mechanic,
  MechanicServiceRate,
  MechanicShift,
  Service,
} from "./types";



const throwIf = <T,>(x: { data: T | null; error: unknown }): T => {
  if (x.error) throw x.error;
  return x.data as T;
};

// BRANDS
export const listBrands = async (): Promise<Brand[]> =>
  throwIf(await supabase.from("brands").select("*").order("name"));
export const createBrand = async (name: string) =>
  throwIf(await supabase.from("brands").insert({ name }).select().single());
export const updateBrand = async (id: string, name: string) =>
  throwIf(await supabase.from("brands").update({ name }).eq("id", id).select().single());
export const deleteBrand = async (id: string) => {
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw error;
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
};

export const listMechanicPayouts = async (
  mechanic_id: string,
): Promise<MechanicPayoutRow[]> => {
  const { data, error } = await supabase
    .from("appointment_services")
    .select(
      "appointment_id, service_id, price, mechanic_payout, service:services(name), appointment:appointments!inner(starts_at, status, mechanic_id)",
    )
    .eq("appointment.mechanic_id", mechanic_id);
  if (error) throw error;
  type Row = {
    appointment_id: string;
    service_id: string;
    price: number;
    mechanic_payout: number;
    service: { name: string } | null;
    appointment: { starts_at: string; status: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    appointment_id: r.appointment_id,
    service_id: r.service_id,
    price: Number(r.price),
    mechanic_payout: Number(r.mechanic_payout),
    starts_at: r.appointment?.starts_at ?? "",
    status: r.appointment?.status ?? "",
    service_name: r.service?.name ?? null,
  }));
};
