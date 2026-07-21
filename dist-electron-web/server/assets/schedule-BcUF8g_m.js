import { K as listMechanics, P as listAppointments, Q as updateAppointmentStatus, h as deleteAppointment, i as createAppointmentPayment, n as clearAppointmentPayments } from "./api-5HwrZJyw.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { n as useConfirm } from "./ConfirmDialog-ClPPfBvs.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { a as PAYMENT_LABELS, i as PAYMENT_COLORS, o as STATUS_COLORS, s as STATUS_LABELS } from "./types-0Ylr05H_.js";
import { t as PrintDocument } from "./PrintDocument-e3dpB7-k.js";
import { t as AppointmentDialog } from "./AppointmentDialog-CwXDaZGB.js";
import { i as DropdownMenuTrigger, n as DropdownMenuContent, r as DropdownMenuItem, t as DropdownMenu } from "./dropdown-menu-NQwLQ7z6.js";
import { useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isYesterday, parseISO, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
//#region src/routes/schedule.tsx?tsr-split=component
var SORT_LABELS = {
	"day-desc": "Сначала новые дни",
	"day-asc": "Сначала старые дни",
	"time-desc": "По времени: позже → раньше",
	"time-asc": "По времени: раньше → позже"
};
var STATUS_STRIPE = {
	scheduled: "bg-blue-400",
	in_progress: "bg-amber-400",
	done: "bg-green-500",
	cancelled: "bg-gray-300"
};
function relativeDayLabel(d) {
	if (isToday(d)) return "Сегодня";
	if (isTomorrow(d)) return "Завтра";
	if (isYesterday(d)) return "Вчера";
	return null;
}
function SchedulePage() {
	const qc = useQueryClient();
	const confirmAction = useConfirm();
	const [mechanicFilter, setMechanicFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [paymentFilter, setPaymentFilter] = useState("all");
	const [sortMode, setSortMode] = useState(() => {
		if (typeof window === "undefined") return "day-desc";
		const v = window.localStorage.getItem("schedule.sort");
		return v && v in SORT_LABELS ? v : "day-desc";
	});
	const [dialog, setDialog] = useState({
		open: false,
		id: null
	});
	const [printApptId, setPrintApptId] = useState(null);
	const { data: appointments = [] } = useQuery({
		queryKey: ["appointments"],
		queryFn: () => listAppointments()
	});
	const { data: mechanics = [] } = useQuery({
		queryKey: ["mechanics"],
		queryFn: listMechanics
	});
	const [payDlg, setPayDlg] = useState({
		open: false,
		id: null,
		total: 0,
		paid: 0,
		paid_at: "",
		amount: "",
		note: ""
	});
	const statusMut = useMutation({
		mutationFn: ({ id, status }) => updateAppointmentStatus(id, status),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
		onError: (e) => toast.error(e.message)
	});
	const addPayMut = useMutation({
		mutationFn: (v) => createAppointmentPayment({
			appointment_id: v.appointment_id,
			paid_at: v.paid_at,
			amount: v.amount,
			note: v.note ?? null
		}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["appointments"] });
			qc.invalidateQueries({ queryKey: ["appointment-payments"] });
			qc.invalidateQueries({ queryKey: ["payments-range"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const clearPayMut = useMutation({
		mutationFn: (id) => clearAppointmentPayments(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["appointments"] });
			qc.invalidateQueries({ queryKey: ["appointment-payments"] });
			qc.invalidateQueries({ queryKey: ["payments-range"] });
			toast.success("Оплата сброшена");
		},
		onError: (e) => toast.error(e.message)
	});
	const deleteMut = useMutation({
		mutationFn: (id) => deleteAppointment(id),
		onSuccess: () => {
			toast.success("Запись удалена");
			qc.invalidateQueries({ queryKey: ["appointments"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const confirmDelete = async (id) => {
		if (await confirmAction({
			title: "Удалить запись?",
			description: "Действие нельзя отменить.",
			destructive: true,
			confirmText: "Удалить"
		})) deleteMut.mutate(id);
	};
	const setStatus = (id, status) => {
		statusMut.mutate({
			id,
			status
		});
	};
	const payFullNow = (id, total, paid) => {
		const due = Math.max(0, total - paid);
		if (due <= 0) {
			toast.info("Уже оплачено полностью");
			return;
		}
		addPayMut.mutate({
			appointment_id: id,
			paid_at: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
			amount: due,
			note: "Полная оплата"
		}, { onSuccess: () => toast.success("Оплата записана") });
	};
	const openPayDialog = (id, total, paid) => {
		const due = Math.max(0, total - paid);
		setPayDlg({
			open: true,
			id,
			total,
			paid,
			paid_at: format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"),
			amount: String(due > 0 ? due : total),
			note: ""
		});
	};
	const submitPayDialog = () => {
		if (!payDlg.id) return;
		const amt = Math.max(0, Math.round(Number(payDlg.amount) || 0));
		if (amt <= 0) {
			toast.error("Введите сумму больше 0");
			return;
		}
		if (!payDlg.paid_at) {
			toast.error("Укажите дату платежа");
			return;
		}
		addPayMut.mutate({
			appointment_id: payDlg.id,
			paid_at: payDlg.paid_at,
			amount: amt,
			note: payDlg.note.trim() || null
		}, { onSuccess: () => {
			setPayDlg((d) => ({
				...d,
				open: false
			}));
			toast.success("Платёж добавлен");
		} });
	};
	const grouped = useMemo(() => {
		const filtered = appointments.filter((a) => (mechanicFilter === "all" || a.mechanic_id === mechanicFilter) && (statusFilter === "all" || a.status === statusFilter) && (paymentFilter === "all" || (a.payment_status ?? "unpaid") === paymentFilter));
		const map = /* @__PURE__ */ new Map();
		for (const a of filtered) {
			const key = format(startOfDay(parseISO(a.starts_at)), "yyyy-MM-dd");
			if (!map.has(key)) map.set(key, []);
			map.get(key).push(a);
		}
		const dayDir = sortMode === "day-asc" || sortMode === "time-asc" ? 1 : -1;
		const timeDir = sortMode === "time-asc" ? 1 : sortMode === "time-desc" ? -1 : 1;
		const entries = Array.from(map.entries()).sort(([a], [b]) => dayDir * a.localeCompare(b));
		for (const [, items] of entries) items.sort((x, y) => timeDir * (parseISO(x.starts_at).getTime() - parseISO(y.starts_at).getTime()));
		return entries;
	}, [
		appointments,
		mechanicFilter,
		statusFilter,
		paymentFilter,
		sortMode
	]);
	const changeSort = (v) => {
		setSortMode(v);
		if (typeof window !== "undefined") window.localStorage.setItem("schedule.sort", v);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-4 flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-bold",
					children: "Записи по дням"
				}), /* @__PURE__ */ jsxs(Button, {
					onClick: () => setDialog({
						open: true,
						id: null
					}),
					children: [/* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }), " Новая запись"]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ jsxs(Select, {
						value: mechanicFilter,
						onValueChange: setMechanicFilter,
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							className: "w-56",
							children: /* @__PURE__ */ jsx(SelectValue, {})
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: "all",
							children: "Все мастера"
						}), mechanics.map((m) => /* @__PURE__ */ jsx(SelectItem, {
							value: m.id,
							children: m.full_name
						}, m.id))] })]
					}),
					/* @__PURE__ */ jsxs(Select, {
						value: statusFilter,
						onValueChange: setStatusFilter,
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							className: "w-56",
							children: /* @__PURE__ */ jsx(SelectValue, {})
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: "all",
							children: "Все статусы"
						}), Object.entries(STATUS_LABELS).map(([k, v]) => /* @__PURE__ */ jsx(SelectItem, {
							value: k,
							children: v
						}, k))] })]
					}),
					/* @__PURE__ */ jsxs(Select, {
						value: paymentFilter,
						onValueChange: setPaymentFilter,
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							className: "w-56",
							children: /* @__PURE__ */ jsx(SelectValue, {})
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: "all",
							children: "Все оплаты"
						}), Object.entries(PAYMENT_LABELS).map(([k, v]) => /* @__PURE__ */ jsx(SelectItem, {
							value: k,
							children: v
						}, k))] })]
					}),
					/* @__PURE__ */ jsxs(Select, {
						value: sortMode,
						onValueChange: (v) => changeSort(v),
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							className: "w-64",
							children: /* @__PURE__ */ jsx(SelectValue, {})
						}), /* @__PURE__ */ jsx(SelectContent, { children: Object.keys(SORT_LABELS).map((k) => /* @__PURE__ */ jsx(SelectItem, {
							value: k,
							children: SORT_LABELS[k]
						}, k)) })]
					})
				]
			}),
			grouped.length === 0 && /* @__PURE__ */ jsx("div", {
				className: "rounded-lg border border-dashed p-8 text-center text-muted-foreground",
				children: "Нет записей"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "space-y-6",
				children: grouped.map(([day, items]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
					className: "sticky top-0 z-10 -mx-1 mb-2 rounded bg-background/85 px-1 py-1 text-sm font-semibold text-muted-foreground backdrop-blur sm:text-base",
					children: format(parseISO(day), "d MMMM yyyy, EEEE", { locale: ru })
				}), /* @__PURE__ */ jsx("div", {
					className: "space-y-2",
					children: items.map((a) => {
						const status = a.status;
						const payment = a.payment_status ?? "unpaid";
						return /* @__PURE__ */ jsxs("div", {
							className: "group relative overflow-hidden rounded-xl border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md",
							children: [/* @__PURE__ */ jsx("span", {
								"aria-hidden": true,
								className: `absolute inset-y-0 left-0 w-1 ${STATUS_STRIPE[status]}`
							}), /* @__PURE__ */ jsxs("div", {
								className: "grid gap-3 py-3 pl-4 pr-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:py-3.5 sm:pl-5 sm:pr-4",
								children: [
									/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => setDialog({
											open: true,
											id: a.id
										}),
										className: "flex items-baseline gap-2 text-left sm:w-20 sm:flex-col sm:items-start sm:gap-0.5",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-xl font-bold leading-none tabular-nums sm:text-2xl",
											children: format(parseISO(a.starts_at), "HH:mm")
										}), (() => {
											const d = parseISO(a.starts_at);
											const rel = relativeDayLabel(d);
											return /* @__PURE__ */ jsxs("span", {
												className: "flex flex-wrap items-baseline gap-1.5 text-[11px] text-muted-foreground",
												children: [/* @__PURE__ */ jsx("span", {
													className: "tabular-nums",
													children: format(d, "d MMM", { locale: ru })
												}), rel && /* @__PURE__ */ jsx("span", {
													className: `rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isToday(d) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`,
													children: rel
												})]
											});
										})()]
									}),
									/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => setDialog({
											open: true,
											id: a.id
										}),
										className: "min-w-0 text-left transition group-hover:text-primary",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "truncate font-semibold",
												children: [
													a.car?.brand?.name,
													" ",
													a.car?.model,
													a.car?.license_plate ? ` · ${a.car.license_plate}` : ""
												]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "truncate text-sm text-muted-foreground",
												children: [a.car?.client?.full_name, a.car?.client?.phone ? ` · ${a.car.client.phone}` : ""]
											}),
											/* @__PURE__ */ jsx("div", {
												className: "mt-1 line-clamp-1 text-xs text-muted-foreground",
												children: a.services.map((s) => s.service?.name).filter(Boolean).join(", ") || "—"
											}),
											a.mechanic && /* @__PURE__ */ jsxs("div", {
												className: "mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground",
												children: [/* @__PURE__ */ jsx("span", {
													className: "h-2 w-2 shrink-0 rounded-full",
													style: { background: a.mechanic.color }
												}), /* @__PURE__ */ jsx("span", {
													className: "truncate",
													children: a.mechanic.full_name
												})]
											})
										]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex flex-col gap-2 sm:items-end",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex items-baseline justify-between gap-2 sm:flex-col sm:items-end sm:gap-0.5",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "text-lg font-bold tabular-nums sm:text-xl",
												children: [Number(a.total_price ?? 0).toLocaleString("ru-RU"), " ₽"]
											}), Number(a.paid_amount ?? 0) > 0 && Number(a.paid_amount) < Number(a.total_price ?? 0) && /* @__PURE__ */ jsxs("div", {
												className: "text-[11px] text-muted-foreground tabular-nums",
												children: [
													"внесено ",
													Number(a.paid_amount).toLocaleString("ru-RU"),
													" ₽"
												]
											})]
										}), /* @__PURE__ */ jsxs("div", {
											className: "flex flex-wrap items-center gap-1.5 sm:justify-end",
											children: [
												/* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
													asChild: true,
													children: /* @__PURE__ */ jsxs("button", {
														type: "button",
														className: `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition hover:opacity-90 ${STATUS_COLORS[status]}`,
														children: [STATUS_LABELS[status], /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3 opacity-70" })]
													})
												}), /* @__PURE__ */ jsx(DropdownMenuContent, {
													align: "end",
													children: Object.keys(STATUS_LABELS).map((s) => /* @__PURE__ */ jsxs(DropdownMenuItem, {
														onClick: () => setStatus(a.id, s),
														className: "gap-2",
														children: [/* @__PURE__ */ jsx(Check, { className: `h-3.5 w-3.5 ${s === status ? "opacity-100" : "opacity-0"}` }), STATUS_LABELS[s]]
													}, s))
												})] }),
												/* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
													asChild: true,
													children: /* @__PURE__ */ jsxs("button", {
														type: "button",
														className: `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition hover:opacity-90 ${PAYMENT_COLORS[payment]}`,
														children: [PAYMENT_LABELS[payment], /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3 opacity-70" })]
													})
												}), /* @__PURE__ */ jsxs(DropdownMenuContent, {
													align: "end",
													children: [
														/* @__PURE__ */ jsx(DropdownMenuItem, {
															onClick: () => payFullNow(a.id, a.total_price ?? 0, a.paid_amount ?? 0),
															children: "Оплачено полностью"
														}),
														/* @__PURE__ */ jsx(DropdownMenuItem, {
															onClick: () => openPayDialog(a.id, a.total_price ?? 0, a.paid_amount ?? 0),
															children: "Записать платёж…"
														}),
														/* @__PURE__ */ jsx(DropdownMenuItem, {
															onClick: async () => {
																if (await confirmAction({
																	title: "Сбросить оплату?",
																	description: "Все платежи по этой записи будут удалены.",
																	destructive: true,
																	confirmText: "Сбросить"
																})) clearPayMut.mutate(a.id);
															},
															className: "text-destructive",
															children: "Сбросить оплату"
														})
													]
												})] }),
												/* @__PURE__ */ jsx("button", {
													type: "button",
													title: "Печать заказ-наряда",
													"aria-label": "Печать заказ-наряда",
													onClick: () => setPrintApptId(a.id),
													className: "inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition hover:bg-accent hover:text-foreground",
													children: /* @__PURE__ */ jsx(Printer, { className: "h-3.5 w-3.5" })
												}),
												/* @__PURE__ */ jsx("button", {
													type: "button",
													title: "Удалить запись",
													"aria-label": "Удалить запись",
													onClick: () => confirmDelete(a.id),
													disabled: deleteMut.isPending,
													className: "inline-flex h-7 w-7 items-center justify-center rounded-full border border-destructive/40 bg-background text-destructive shadow-sm transition hover:bg-destructive/10 disabled:opacity-50",
													children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
												})
											]
										})]
									})
								]
							})]
						}, a.id);
					})
				})] }, day))
			}),
			/* @__PURE__ */ jsx(AppointmentDialog, {
				open: dialog.open,
				onOpenChange: (o) => setDialog((d) => ({
					...d,
					open: o
				})),
				appointmentId: dialog.id
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: payDlg.open,
				onOpenChange: (o) => setPayDlg((d) => ({
					...d,
					open: o
				})),
				children: /* @__PURE__ */ jsxs(DialogContent, {
					className: "sm:max-w-sm",
					children: [
						/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Записать платёж" }) }),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "text-sm text-muted-foreground",
									children: [
										"Итого: ",
										/* @__PURE__ */ jsxs("span", {
											className: "font-medium text-foreground",
											children: [payDlg.total, " ₽"]
										}),
										payDlg.paid > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [" · уже внесено ", /* @__PURE__ */ jsxs("span", {
											className: "font-medium text-foreground",
											children: [payDlg.paid, " ₽"]
										})] })
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ jsx(Label, {
											htmlFor: "pay-date",
											children: "Дата"
										}), /* @__PURE__ */ jsx(Input, {
											id: "pay-date",
											type: "date",
											value: payDlg.paid_at,
											onChange: (e) => setPayDlg((d) => ({
												...d,
												paid_at: e.target.value
											}))
										})]
									}), /* @__PURE__ */ jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ jsx(Label, {
											htmlFor: "pay-amount",
											children: "Сумма, ₽"
										}), /* @__PURE__ */ jsx(Input, {
											id: "pay-amount",
											type: "number",
											inputMode: "numeric",
											min: 0,
											value: payDlg.amount,
											onChange: (e) => setPayDlg((d) => ({
												...d,
												amount: e.target.value
											})),
											onKeyDown: (e) => {
												if (e.key === "Enter") submitPayDialog();
											},
											autoFocus: true
										})]
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ jsx(Label, {
										htmlFor: "pay-note",
										children: "Заметка (необязательно)"
									}), /* @__PURE__ */ jsx(Input, {
										id: "pay-note",
										value: payDlg.note,
										onChange: (e) => setPayDlg((d) => ({
											...d,
											note: e.target.value
										})),
										placeholder: "Например: наличными"
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							onClick: () => setPayDlg((d) => ({
								...d,
								open: false
							})),
							children: "Отмена"
						}), /* @__PURE__ */ jsx(Button, {
							onClick: submitPayDialog,
							disabled: addPayMut.isPending,
							children: "Сохранить"
						})] })
					]
				})
			}),
			printApptId && /* @__PURE__ */ jsx(ApptPrint, {
				appt: appointments.find((x) => x.id === printApptId) ?? null,
				onDone: () => setPrintApptId(null)
			})
		]
	});
}
function ApptPrint({ appt, onDone }) {
	if (!appt) {
		onDone();
		return null;
	}
	const car = appt.car;
	const client = car?.client;
	const brand = car?.brand?.name ?? "";
	const status = appt.status ?? "planned";
	const payment = appt.payment_status ?? "unpaid";
	const total = appt.total_price ?? 0;
	const paid = appt.paid_amount ?? 0;
	const due = Math.max(0, total - paid);
	const carSection = [
		{
			label: "Марка / модель",
			value: `${brand} ${car?.model ?? ""}`.trim()
		},
		{
			label: "Год выпуска",
			value: car?.year ? String(car.year) : ""
		},
		{
			label: "Госномер",
			value: car?.license_plate ?? ""
		},
		{
			label: "VIN",
			value: car?.vin ?? ""
		},
		{
			label: "Двигатель",
			value: [car?.engine_volume ? `${car.engine_volume} л` : "", car?.engine_power ? `${car.engine_power} л.с.` : ""].filter(Boolean).join(" · ")
		},
		{
			label: "Кузов / КПП / привод",
			value: [
				car?.color ?? "",
				car?.transmission ?? "",
				car?.drive_type ?? ""
			].filter(Boolean).join(" · ")
		},
		{
			label: "Пробег",
			value: car?.mileage ? `${car.mileage} км` : ""
		}
	];
	const clientSection = [{
		label: "ФИО",
		value: client?.full_name ?? ""
	}, {
		label: "Телефон",
		value: client?.phone ?? ""
	}];
	const works = appt.services.map((s) => ({
		name: s.service?.name ?? "Услуга",
		price: s.price ?? 0
	}));
	const dateStr = format(new Date(appt.starts_at), "d MMMM yyyy, HH:mm", { locale: ru });
	return /* @__PURE__ */ jsx(PrintDocument, {
		onDone,
		title: `Заказ-наряд № ${appt.id.slice(0, 8).toUpperCase()}`,
		meta: [
			{
				label: "Дата и время",
				value: dateStr
			},
			{
				label: "Мастер",
				value: appt.mechanic?.full_name ?? "—"
			},
			{
				label: "Статус",
				value: STATUS_LABELS[status]
			},
			{
				label: "Оплата",
				value: PAYMENT_LABELS[payment]
			}
		],
		sections: [{
			title: "Клиент",
			rows: clientSection
		}, {
			title: "Автомобиль",
			rows: carSection
		}],
		works,
		total,
		footer: [{
			label: "Внесено",
			value: new Intl.NumberFormat("ru-RU").format(paid) + " ₽"
		}, {
			label: "К доплате",
			value: new Intl.NumberFormat("ru-RU").format(due) + " ₽"
		}],
		signatures: true
	});
}
//#endregion
export { SchedulePage as component };
