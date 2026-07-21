import { B as listClients, K as listMechanics, P as listAppointments, R as listCars } from "./api-5HwrZJyw.js";
import { n as CardContent, t as Card } from "./card-BXjpJ96D.js";
import { o as STATUS_COLORS, s as STATUS_LABELS } from "./types-0Ylr05H_.js";
import { t as Badge } from "./badge-D1Dupn2y.js";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Car, Clock, Users, Wrench } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
//#region src/components/AdminStats.tsx
function AdminStats() {
	const now = useMemo(() => /* @__PURE__ */ new Date(), []);
	const from = useMemo(() => {
		const d = new Date(now);
		d.setHours(0, 0, 0, 0);
		return d;
	}, [now]);
	const to = useMemo(() => {
		const d = new Date(from);
		d.setDate(d.getDate() + 7);
		return d;
	}, [from]);
	const { data: clients = [] } = useQuery({
		queryKey: ["clients"],
		queryFn: listClients
	});
	const { data: cars = [] } = useQuery({
		queryKey: ["cars"],
		queryFn: listCars
	});
	const { data: mechanics = [] } = useQuery({
		queryKey: ["mechanics"],
		queryFn: listMechanics
	});
	const { data: upcoming = [] } = useQuery({
		queryKey: [
			"dashboard-upcoming",
			from.toISOString(),
			to.toISOString()
		],
		queryFn: () => listAppointments(from, to)
	});
	const todayISO = from.toISOString().slice(0, 10);
	const todayCount = upcoming.filter((a) => a.starts_at.slice(0, 10) === todayISO).length;
	const stats = [
		{
			label: "Клиентов",
			value: clients.length,
			icon: Users
		},
		{
			label: "Машин",
			value: cars.length,
			icon: Car
		},
		{
			label: "Мастеров",
			value: mechanics.length,
			icon: Wrench
		},
		{
			label: "Записей сегодня",
			value: todayCount,
			icon: Calendar
		}
	];
	const fmtDate = (iso) => {
		return new Date(iso).toLocaleString("ru-RU", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit"
		});
	};
	return /* @__PURE__ */ jsx("section", {
		className: "bg-background text-foreground",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "mb-6",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-bold sm:text-2xl",
						children: "Статистика"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-muted-foreground sm:text-sm",
						children: "Кого сколько и когда — сводка по автосервису"
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4",
					children: stats.map((s) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
						className: "flex items-center gap-3 p-4 sm:gap-4 sm:p-5",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-11 sm:w-11",
							children: /* @__PURE__ */ jsx(s.icon, { className: "h-5 w-5 text-foreground/70" })
						}), /* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-xl font-bold sm:text-2xl",
								children: s.value
							}), /* @__PURE__ */ jsx("div", {
								className: "text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs",
								children: s.label
							})]
						})]
					}) }, s.label))
				}),
				/* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
					className: "p-4 sm:p-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "mb-4 flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-semibold sm:text-lg",
							children: "Ближайшие записи"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-muted-foreground",
							children: "На ближайшие 7 дней"
						})] }), /* @__PURE__ */ jsx(Link, {
							to: "/calendar",
							className: "text-sm text-primary hover:underline",
							children: "Открыть календарь →"
						})]
					}), upcoming.length === 0 ? /* @__PURE__ */ jsxs("div", {
						className: "rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground",
						children: [
							"Записей нет — самое время",
							" ",
							/* @__PURE__ */ jsx(Link, {
								to: "/calendar",
								className: "text-primary hover:underline",
								children: "создать первую"
							}),
							"."
						]
					}) : /* @__PURE__ */ jsx("div", {
						className: "space-y-2",
						children: upcoming.slice(0, 8).map((a) => {
							const status = a.status;
							return /* @__PURE__ */ jsxs(Link, {
								to: "/calendar",
								className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border p-3 transition hover:bg-muted/40 sm:flex sm:flex-wrap sm:gap-3",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "col-span-2 flex items-center gap-2 text-xs text-muted-foreground sm:col-auto sm:min-w-40 sm:text-sm sm:text-foreground",
										children: [/* @__PURE__ */ jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }), fmtDate(a.starts_at)]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "min-w-0 sm:flex-1",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "truncate text-sm font-medium",
											children: [
												a.car?.brand?.name,
												" ",
												a.car?.model,
												a.car?.license_plate ? /* @__PURE__ */ jsx("span", {
													className: "ml-2 text-xs text-muted-foreground",
													children: a.car.license_plate
												}) : null
											]
										}), /* @__PURE__ */ jsxs("div", {
											className: "truncate text-xs text-muted-foreground",
											children: [a.car?.client?.full_name ?? "—", a.mechanic ? ` · ${a.mechanic.full_name}` : ""]
										})]
									}),
									/* @__PURE__ */ jsx(Badge, {
										className: STATUS_COLORS[status],
										children: STATUS_LABELS[status]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "text-sm font-medium",
										children: [new Intl.NumberFormat("ru-RU").format(a.total_price), " ₽"]
									})
								]
							}, a.id);
						})
					})]
				}) })
			]
		})
	});
}
//#endregion
//#region src/routes/stats.tsx?tsr-split=component
function StatsPage() {
	const { data: appointments = [] } = useQuery({
		queryKey: ["appointments"],
		queryFn: () => listAppointments()
	});
	const debtors = useMemo(() => appointments.filter((a) => a.status === "done" && a.payment_status !== "paid" && (a.total_price ?? 0) - (a.paid_amount ?? 0) > 0).sort((a, b) => b.starts_at.localeCompare(a.starts_at)), [appointments]);
	const totalDebt = debtors.reduce((s, a) => s + ((a.total_price ?? 0) - (a.paid_amount ?? 0)), 0);
	const fmt = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(AdminStats, {}), /* @__PURE__ */ jsx("section", {
		className: "mx-auto max-w-7xl px-4 pb-10 sm:px-6",
		children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
			className: "p-4 sm:p-6",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "mb-4 flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
					className: "text-base font-semibold sm:text-lg",
					children: "Дебиторка"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted-foreground",
					children: "Выполненные работы, за которые ещё не расплатились"
				})] }), /* @__PURE__ */ jsxs(Badge, {
					variant: "secondary",
					className: "text-base",
					children: ["Итого: ", fmt(totalDebt)]
				})]
			}), debtors.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground",
				children: "Долгов нет — все клиенты рассчитались."
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-2",
				children: debtors.map((a) => {
					const debt = (a.total_price ?? 0) - (a.paid_amount ?? 0);
					return /* @__PURE__ */ jsxs(Link, {
						to: "/schedule",
						className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/40",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "truncate text-sm font-medium",
								children: [a.car?.client?.full_name ?? "—", a.car?.client?.phone ? /* @__PURE__ */ jsx("span", {
									className: "ml-2 text-xs text-muted-foreground",
									children: a.car.client.phone
								}) : null]
							}), /* @__PURE__ */ jsxs("div", {
								className: "truncate text-xs text-muted-foreground",
								children: [
									a.car?.brand?.name,
									" ",
									a.car?.model,
									a.car?.license_plate ? ` · ${a.car.license_plate}` : "",
									" · ",
									format(parseISO(a.starts_at), "d MMM yyyy", { locale: ru })
								]
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-right",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-sm font-semibold text-red-600",
								children: fmt(debt)
							}), /* @__PURE__ */ jsxs("div", {
								className: "text-xs text-muted-foreground",
								children: ["из ", fmt(a.total_price ?? 0)]
							})]
						})]
					}, a.id);
				})
			})]
		}) })
	})] });
}
//#endregion
export { StatsPage as component };
