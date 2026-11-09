import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppointmentDialog } from "./AppointmentDialog";

const api = vi.hoisted(() => ({
  get: vi.fn(), save: vi.fn(), pay: vi.fn(), payments: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  getAppointment: api.get, updateAppointment: api.save,
  createAppointmentPayment: api.pay, listAppointmentPayments: api.payments,
  listClients: async () => [], listCars: async () => [], listMechanics: async () => [],
  listServices: async () => [], listBrands: async () => [], listCarModels: async () => [],
  listMechanicServiceRates: async () => [], humanizeSupabaseError: (e: Error) => e.message,
}));
vi.mock("@/hooks/useCarCustomServices", () => ({ useCarCustomServices: () => ({ enabled: false, items: [] }) }));
vi.mock("@/hooks/useServiceUsage", () => ({ useServiceUsage: () => ({ bump: vi.fn() }) }));
vi.mock("@/components/ConfirmDialog", () => ({ useConfirm: () => async () => true }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const october = "2026-10-15T05:00:00Z";
const entry = (id: string, starts_at = october) => ({
  id, starts_at, car_id: "car", car: null, mechanic_id: null,
  duration_minutes: 60, status: "completed", mileage: null, comment: null,
  services: [{ service_id: "service", price: 1234, mechanic_payout: 617 }],
});
function deferred<T>() {
  let resolve: (value: T) => void = () => { throw new Error("Promise not initialized"); };
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function setup(id = "october") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  const close = vi.fn();
  const view = (appointmentId: string, open = true) => <QueryClientProvider client={qc}><AppointmentDialog open={open} appointmentId={appointmentId} onOpenChange={close} /></QueryClientProvider>;
  const rendered = render(view(id));
  return { qc, close, switchTo: (next: string, open = true) => rendered.rerender(view(next, open)) };
}
const date = () => screen.getByLabelText<HTMLInputElement>("Дата оплаты");
const paymentButton = () => screen.getByRole("button", { name: /^Добавить$/ });
function fillPayment() {
  fireEvent.click(screen.getByRole("button", { name: /Заполнить остатком/ }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T09:00:00Z"));
  api.get.mockImplementation(async (id: string) => entry(id));
  api.payments.mockResolvedValue([]);
  api.save.mockResolvedValue(undefined);
  api.pay.mockResolvedValue({ id: "payment" });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("AppointmentDialog: дата оплаты при асинхронной загрузке", () => {
  it("не открывает оплату до первого uncached ответа и отправляет октябрьскую дату", async () => {
    const load = deferred<ReturnType<typeof entry>>();
    api.get.mockReturnValueOnce(load.promise);
    setup();
    expect(screen.queryByLabelText("Дата оплаты")).toBeNull();
    await act(async () => { load.resolve(entry("october")); });
    await waitFor(() => expect(date().value).toBe("2026-10-15"));
    fillPayment();
    fireEvent.click(paymentButton());
    await waitFor(() => expect(api.pay).toHaveBeenCalledWith({ appointment_id: "october", paid_at: "2026-10-15", amount: 1234, note: null }));
  });

  it("сбрасывает ручную дату при переключении работы, включая uncached и cached переходы", async () => {
    const { switchTo } = setup();
    await waitFor(() => expect(date().value).toBe("2026-10-15"));
    fireEvent.change(date(), { target: { value: "2026-11-03" } });
    const load = deferred<ReturnType<typeof entry>>();
    api.get.mockReturnValueOnce(load.promise);
    switchTo("other");
    expect(screen.queryByLabelText("Дата оплаты")).toBeNull();
    await act(async () => { load.resolve(entry("other", "2026-10-31T05:00:00Z")); });
    await waitFor(() => expect(date().value).toBe("2026-10-31"));
    switchTo("october");
    await waitFor(() => expect(date().value).toBe("2026-10-15"));
  });

  it("не затирает вручную введённую дату при refetch, даже с новой датой работы", async () => {
    const { qc } = setup();
    await waitFor(() => expect(date().value).toBe("2026-10-15"));
    fireEvent.change(date(), { target: { value: "2026-10-20" } });
    api.get.mockResolvedValue(entry("october", "2026-10-31T05:00:00Z"));
    await act(async () => { await qc.refetchQueries({ queryKey: ["appointment", "october"], exact: true }); });
    expect(date().value).toBe("2026-10-20");
    fillPayment();
    expect(date().value).toBe("2026-10-20");
    fireEvent.click(paymentButton());
    await waitFor(() => expect(api.pay).toHaveBeenCalledWith(expect.objectContaining({ paid_at: "2026-10-20" })));
  });

  it("обновляет автоматическую дату при изменении сохранённой даты работы", async () => {
    const { qc } = setup();
    await waitFor(() => expect(date().value).toBe("2026-10-15"));
    api.get.mockResolvedValue(entry("october", "2026-10-31T05:00:00Z"));
    await act(async () => { await qc.refetchQueries({ queryKey: ["appointment", "october"], exact: true }); });
    await waitFor(() => expect(date().value).toBe("2026-10-31"));
  });

  it("блокирует оплату несохранённой даты; после сохранения и cached reopen берёт новую дату", async () => {
    const { switchTo, close } = setup();
    await waitFor(() => expect(date().value).toBe("2026-10-15"));
    const workDate = document.querySelector<HTMLInputElement>('input[type="date"]');
    if (!workDate) throw new Error("Work date missing");
    fireEvent.change(workDate, { target: { value: "2026-10-31" } });
    fillPayment();
    expect(paymentButton().hasAttribute("disabled")).toBe(true);
    fireEvent.click(paymentButton());
    expect(api.pay).not.toHaveBeenCalled();
    const load = deferred<ReturnType<typeof entry>>();
    api.get.mockReturnValueOnce(load.promise);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
    expect(api.save).toHaveBeenCalledWith("october", expect.objectContaining({ starts_at: "2026-10-31T05:00:00.000Z" }));
    switchTo("october", false);
    switchTo("october", true);
    await waitFor(() => expect(date().value).toBe("2026-10-31"));
    fillPayment();
    fireEvent.click(paymentButton());
    await waitFor(() => expect(api.pay).toHaveBeenCalledWith(expect.objectContaining({ paid_at: "2026-10-31" })));
    await act(async () => { load.resolve(entry("october", "2026-10-31T05:00:00Z")); });
  });
});