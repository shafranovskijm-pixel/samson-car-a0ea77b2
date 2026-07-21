import { K as listMechanics, M as listAllMechanicShifts, O as getAppointment, P as listAppointments, T as deleteMechanicShift, Z as updateAppointment, ot as updateMechanicShift, p as createMechanicShift } from "./api-5HwrZJyw.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { s as STATUS_LABELS } from "./types-0Ylr05H_.js";
import { t as Route } from "./calendar-ByzX_YRu.js";
import { t as AppointmentDialog } from "./AppointmentDialog-CwXDaZGB.js";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Calendar as Calendar$1, Views, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDropDefault from "react-big-calendar/lib/addons/dragAndDrop/index.js";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
//#region src/routes/calendar.tsx?tsr-split=component
var localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: (d) => startOfWeek(d, { weekStartsOn: 1 }),
	getDay,
	locales: { ru }
});
var messages = {
	allDay: "Весь день",
	previous: "Назад",
	next: "Вперёд",
	today: "Сегодня",
	month: "Месяц",
	week: "Неделя",
	day: "День",
	agenda: "Список",
	date: "Дата",
	time: "Время",
	event: "Запись",
	noEventsInRange: "Нет записей",
	showMore: (n) => `+ ещё ${n}`
};
var DnDCalendar = (withDragAndDropDefault.default ?? withDragAndDropDefault)(Calendar$1);
function parseServices(s) {
	if (!s) return [];
	return s.split(",").map((p) => p.split(":")).filter((a) => a.length === 2 && a[0]).map(([id, price]) => ({
		service_id: id,
		price: Number(price) || 0
	}));
}
function CalendarPage() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: "/calendar" });
	const [mode, setMode] = useState("appointments");
	const [view, setView] = useState(typeof window !== "undefined" && window.innerWidth < 640 ? Views.DAY : Views.WEEK);
	const [date, setDate] = useState(/* @__PURE__ */ new Date());
	const [dialog, setDialog] = useState({
		open: false,
		id: null,
		start: null,
		prefill: null
	});
	const [shiftDlg, setShiftDlg] = useState({
		open: false,
		id: null,
		mechanic_id: "",
		start: null,
		end: null,
		note: ""
	});
	const [activeMechanicId, setActiveMechanicId] = useState("");
	const { data: appointments = [] } = useQuery({
		queryKey: ["appointments"],
		queryFn: () => listAppointments()
	});
	const { data: mechanics = [] } = useQuery({
		queryKey: ["mechanics"],
		queryFn: listMechanics
	});
	const { data: shifts = [] } = useQuery({
		queryKey: ["mechanic-shifts", "all"],
		queryFn: listAllMechanicShifts,
		enabled: mode === "shifts"
	});
	const appointmentEvents = useMemo(() => appointments.map((a) => {
		const start = new Date(a.starts_at);
		const end = new Date(start.getTime() + a.duration_minutes * 6e4);
		const car = a.car;
		const title = `${car?.brand?.name ?? ""} ${car?.model ?? ""} · ${car?.client?.full_name ?? ""}`.trim();
		const mech = mechanics.find((m) => m.id === a.mechanic_id);
		return {
			id: a.id,
			title,
			start,
			end,
			resource: {
				kind: "appt",
				color: mech?.color ?? "#64748b",
				status: a.status
			}
		};
	}), [appointments, mechanics]);
	const shiftEvents = useMemo(() => shifts.map((s) => {
		const mech = mechanics.find((m) => m.id === s.mechanic_id);
		return {
			id: s.id,
			title: `${mech?.full_name ?? "Мастер"}${s.note ? " · " + s.note : ""}`,
			start: new Date(s.starts_at),
			end: new Date(s.ends_at),
			resource: {
				kind: "shift",
				color: mech?.color ?? "#64748b",
				mechanic_id: s.mechanic_id,
				note: s.note ?? ""
			}
		};
	}), [shifts, mechanics]);
	const events = mode === "appointments" ? appointmentEvents : shiftEvents;
	const hasPrefill = !!(search.services || search.brand || search.model || search.carId);
	const currentPrefill = hasPrefill ? {
		services: parseServices(search.services),
		brand: search.brand,
		model: search.model,
		carId: search.carId
	} : null;
	const openNew = (start) => {
		setDialog({
			open: true,
			id: null,
			start,
			prefill: currentPrefill
		});
		if (hasPrefill) navigate({
			search: {},
			replace: true
		});
	};
	const openNewShift = (start, end) => {
		setShiftDlg({
			open: true,
			id: null,
			mechanic_id: mechanics[0]?.id ?? "",
			start,
			end,
			note: ""
		});
	};
	const now = useMemo(() => /* @__PURE__ */ new Date(), []);
	const qc = useQueryClient();
	const moveMutation = useMutation({
		mutationFn: async (args) => {
			const appt = await getAppointment(args.id);
			const durationMs = args.end.getTime() - args.start.getTime();
			const duration_minutes = Math.max(15, Math.round(durationMs / 6e4));
			await updateAppointment(args.id, {
				car_id: appt.car_id,
				mechanic_id: appt.mechanic_id,
				starts_at: args.start.toISOString(),
				duration_minutes,
				status: appt.status,
				mileage: appt.mileage,
				comment: appt.comment,
				services: appt.services.map((s) => ({
					service_id: s.service_id,
					price: s.price,
					mechanic_payout: s.mechanic_payout ?? 0
				}))
			});
		},
		onSuccess: () => {
			toast.success("Запись перемещена");
			qc.invalidateQueries({ queryKey: ["appointments"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const invalidateShifts = () => {
		qc.invalidateQueries({ queryKey: ["mechanic-shifts", "all"] });
		qc.invalidateQueries({ queryKey: ["mechanic-shifts"] });
	};
	const createShiftMut = useMutation({
		mutationFn: createMechanicShift,
		onSuccess: () => {
			toast.success("Смена добавлена");
			invalidateShifts();
		},
		onError: (e) => toast.error(e.message)
	});
	const updateShiftMut = useMutation({
		mutationFn: (v) => updateMechanicShift(v.id, {
			starts_at: v.starts_at,
			ends_at: v.ends_at,
			note: v.note
		}),
		onSuccess: () => {
			toast.success("Смена обновлена");
			invalidateShifts();
		},
		onError: (e) => toast.error(e.message)
	});
	const deleteShiftMut = useMutation({
		mutationFn: deleteMechanicShift,
		onSuccess: () => {
			toast.success("Смена удалена");
			invalidateShifts();
		},
		onError: (e) => toast.error(e.message)
	});
	const onEventDrop = ({ event, start, end }) => {
		const e = event;
		const s = start instanceof Date ? start : new Date(start);
		const en = end instanceof Date ? end : new Date(end);
		if (e.resource?.kind === "shift") updateShiftMut.mutate({
			id: e.id,
			starts_at: s.toISOString(),
			ends_at: en.toISOString()
		});
		else moveMutation.mutate({
			id: e.id,
			start: s,
			end: en
		});
	};
	const onEventResize = ({ event, start, end }) => {
		const e = event;
		const s = start instanceof Date ? start : new Date(start);
		const en = end instanceof Date ? end : new Date(end);
		if (e.resource?.kind === "shift") updateShiftMut.mutate({
			id: e.id,
			starts_at: s.toISOString(),
			ends_at: en.toISOString()
		});
		else moveMutation.mutate({
			id: e.id,
			start: s,
			end: en
		});
	};
	const submitShift = () => {
		if (!shiftDlg.mechanic_id || !shiftDlg.start || !shiftDlg.end) {
			toast.error("Выберите мастера и время");
			return;
		}
		if (shiftDlg.end.getTime() <= shiftDlg.start.getTime()) {
			toast.error("Конец смены должен быть позже начала");
			return;
		}
		const payload = {
			starts_at: shiftDlg.start.toISOString(),
			ends_at: shiftDlg.end.toISOString(),
			note: shiftDlg.note.trim() || null
		};
		if (shiftDlg.id) updateShiftMut.mutate({
			id: shiftDlg.id,
			...payload
		}, { onSuccess: () => setShiftDlg((d) => ({
			...d,
			open: false
		})) });
		else createShiftMut.mutate({
			mechanic_id: shiftDlg.mechanic_id,
			...payload
		}, { onSuccess: () => setShiftDlg((d) => ({
			...d,
			open: false
		})) });
	};
	const toLocalInput = (d) => {
		if (!d) return "";
		const pad = (n) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-3 sm:p-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-3 flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "inline-flex rounded-md border bg-muted p-0.5",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setMode("appointments"),
						className: `rounded px-3 py-1.5 text-sm font-medium transition ${mode === "appointments" ? "bg-background shadow-sm" : "text-muted-foreground"}`,
						children: "Записи"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setMode("shifts"),
						className: `rounded px-3 py-1.5 text-sm font-medium transition ${mode === "shifts" ? "bg-background shadow-sm" : "text-muted-foreground"}`,
						children: "Сотрудники"
					})]
				}), mode === "appointments" ? /* @__PURE__ */ jsxs(Button, {
					onClick: () => openNew(/* @__PURE__ */ new Date()),
					children: [/* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }), " Новая запись"]
				}) : /* @__PURE__ */ jsxs(Button, {
					onClick: () => {
						const s = /* @__PURE__ */ new Date();
						s.setMinutes(0, 0, 0);
						openNewShift(s, new Date(s.getTime() + 480 * 60 * 1e3));
					},
					children: [/* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }), " Новая смена"]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-4",
				children: [
					/* @__PURE__ */ jsx("h1", {
						className: "text-2xl font-bold",
						children: mode === "appointments" ? "Календарь записей" : "График сотрудников"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted-foreground",
						children: mode === "appointments" ? `${appointments.length} записей · клик по свободному слоту создаёт новую` : activeMechanicId ? "Выбран мастер — клик по дню/неделе/слоту сразу закрашивает смену его цветом" : "Выберите мастера ниже, чтобы отмечать смены кликом, или добавьте через «Новая смена»"
					}),
					hasPrefill && mode === "appointments" && /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-red-600",
						children: "Данные из калькулятора готовы — выберите свободный слот на календаре"
					})
				]
			}),
			mode === "shifts" ? /* @__PURE__ */ jsxs("div", {
				className: "mb-3 flex flex-wrap items-center gap-1.5",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => setActiveMechanicId(""),
					className: `rounded-full border px-2.5 py-1 text-xs font-medium transition ${activeMechanicId === "" ? "border-foreground bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-muted"}`,
					children: "Никто"
				}), mechanics.map((m) => {
					return /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => setActiveMechanicId(m.id),
						className: "rounded-full border px-2.5 py-1 text-xs font-medium transition",
						style: activeMechanicId === m.id ? {
							background: m.color,
							borderColor: m.color,
							color: "#fff"
						} : {
							borderColor: m.color,
							color: m.color
						},
						children: [/* @__PURE__ */ jsx("span", {
							className: "mr-1 inline-block h-2 w-2 rounded-full align-middle",
							style: { background: m.color }
						}), m.full_name]
					}, m.id);
				})]
			}) : /* @__PURE__ */ jsx("div", {
				className: "mb-3 flex flex-wrap gap-2 text-xs",
				children: mechanics.map((m) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ jsx("span", {
						className: "h-3 w-3 rounded",
						style: { background: m.color }
					}), /* @__PURE__ */ jsx("span", { children: m.full_name })]
				}, m.id))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mb-3 text-xs text-muted-foreground",
				children: mode === "appointments" ? "Записи можно перетаскивать между слотами и растягивать за нижний край" : "Смены можно перетаскивать и растягивать; клик по смене — редактировать"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "rounded-lg border bg-card",
				style: { height: "calc(100dvh - 220px)" },
				children: /* @__PURE__ */ jsx(DnDCalendar, {
					localizer,
					events,
					culture: "ru",
					messages,
					view,
					onView: setView,
					date,
					onNavigate: setDate,
					views: [
						Views.MONTH,
						Views.WEEK,
						Views.DAY,
						Views.AGENDA
					],
					selectable: true,
					resizable: true,
					draggableAccessor: () => true,
					onEventDrop,
					onEventResize,
					getNow: () => /* @__PURE__ */ new Date(),
					scrollToTime: now,
					onSelectSlot: (slot) => {
						const s = slot.start;
						const e = slot.end;
						if (mode === "shifts") if (activeMechanicId) {
							const sameMidnight = s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 0 && e.getMinutes() === 0;
							let start = s;
							let end = e;
							if (sameMidnight) {
								const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 864e5));
								start = new Date(s);
								start.setHours(9, 0, 0, 0);
								end = new Date(s);
								end.setDate(end.getDate() + (days - 1));
								end.setHours(18, 0, 0, 0);
							}
							createShiftMut.mutate({
								mechanic_id: activeMechanicId,
								starts_at: start.toISOString(),
								ends_at: end.toISOString(),
								note: null
							});
						} else openNewShift(s, e);
						else openNew(s);
					},
					onSelectEvent: (ev) => {
						const e = ev;
						if (e.resource?.kind === "shift") setShiftDlg({
							open: true,
							id: e.id,
							mechanic_id: e.resource.mechanic_id ?? "",
							start: e.start,
							end: e.end,
							note: e.resource.note ?? ""
						});
						else setDialog({
							open: true,
							id: e.id,
							start: null,
							prefill: null
						});
					},
					eventPropGetter: (ev) => {
						const e = ev;
						return { style: {
							backgroundColor: e.resource?.color ?? "#64748b",
							border: "none",
							opacity: e.resource?.kind === "shift" ? .75 : e.resource?.status === "cancelled" ? .4 : 1
						} };
					},
					slotPropGetter: (slotDate) => slotDate.getTime() < now.getTime() - 6e4 ? { style: { backgroundColor: "rgba(0,0,0,0.04)" } } : {},
					dayPropGetter: (day) => {
						const today = /* @__PURE__ */ new Date();
						return day.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() ? { style: { backgroundColor: "rgba(0,0,0,0.03)" } } : {};
					},
					tooltipAccessor: (ev) => {
						const e = ev;
						if (e.resource?.kind === "shift") return e.title;
						return `${e.title} · ${STATUS_LABELS[e.resource?.status] ?? ""}`;
					}
				})
			}),
			/* @__PURE__ */ jsx(AppointmentDialog, {
				open: dialog.open,
				onOpenChange: (o) => setDialog((d) => ({
					...d,
					open: o
				})),
				appointmentId: dialog.id,
				defaultStart: dialog.start,
				defaultServices: dialog.prefill?.services,
				defaultBrandId: dialog.prefill?.brand,
				defaultModelId: dialog.prefill?.model,
				defaultCarId: dialog.prefill?.carId || null
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: shiftDlg.open,
				onOpenChange: (o) => setShiftDlg((d) => ({
					...d,
					open: o
				})),
				children: /* @__PURE__ */ jsxs(DialogContent, {
					className: "sm:max-w-md",
					children: [
						/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: shiftDlg.id ? "Смена" : "Новая смена" }) }),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ jsx(Label, { children: "Мастер" }), /* @__PURE__ */ jsxs(Select, {
										value: shiftDlg.mechanic_id,
										onValueChange: (v) => setShiftDlg((d) => ({
											...d,
											mechanic_id: v
										})),
										disabled: !!shiftDlg.id,
										children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите мастера" }) }), /* @__PURE__ */ jsx(SelectContent, { children: mechanics.map((m) => /* @__PURE__ */ jsx(SelectItem, {
											value: m.id,
											children: /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-2",
												children: [/* @__PURE__ */ jsx("span", {
													className: "h-2.5 w-2.5 rounded-full",
													style: { background: m.color }
												}), m.full_name]
											})
										}, m.id)) })]
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ jsx(Label, {
											htmlFor: "shift-start",
											children: "Начало"
										}), /* @__PURE__ */ jsx(Input, {
											id: "shift-start",
											type: "datetime-local",
											value: toLocalInput(shiftDlg.start),
											onChange: (e) => setShiftDlg((d) => ({
												...d,
												start: e.target.value ? new Date(e.target.value) : null
											}))
										})]
									}), /* @__PURE__ */ jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ jsx(Label, {
											htmlFor: "shift-end",
											children: "Конец"
										}), /* @__PURE__ */ jsx(Input, {
											id: "shift-end",
											type: "datetime-local",
											value: toLocalInput(shiftDlg.end),
											onChange: (e) => setShiftDlg((d) => ({
												...d,
												end: e.target.value ? new Date(e.target.value) : null
											}))
										})]
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ jsx(Label, {
										htmlFor: "shift-note",
										children: "Заметка"
									}), /* @__PURE__ */ jsx(Input, {
										id: "shift-note",
										value: shiftDlg.note,
										onChange: (e) => setShiftDlg((d) => ({
											...d,
											note: e.target.value
										})),
										placeholder: "Например: подмена, дежурство"
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs(DialogFooter, {
							className: "flex-row justify-between sm:justify-between",
							children: [/* @__PURE__ */ jsx("div", { children: shiftDlg.id && /* @__PURE__ */ jsx(Button, {
								variant: "destructive",
								onClick: () => deleteShiftMut.mutate(shiftDlg.id, { onSuccess: () => setShiftDlg((d) => ({
									...d,
									open: false
								})) }),
								children: "Удалить"
							}) }), /* @__PURE__ */ jsxs("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ jsx(Button, {
									variant: "outline",
									onClick: () => setShiftDlg((d) => ({
										...d,
										open: false
									})),
									children: "Отмена"
								}), /* @__PURE__ */ jsx(Button, {
									onClick: submitShift,
									disabled: createShiftMut.isPending || updateShiftMut.isPending,
									children: "Сохранить"
								})]
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { CalendarPage as component };
