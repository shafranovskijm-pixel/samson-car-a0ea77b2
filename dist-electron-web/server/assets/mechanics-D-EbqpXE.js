import { $ as listServices, E as deleteMechanicShift, G as listMechanicPayouts, J as listMechanics, K as listMechanicServiceRates, T as deleteMechanicAdvance, W as listMechanicAdvances, d as createMechanic, et as recalcMechanicPayouts, f as createMechanicAdvance, ht as upsertMechanicServiceRate, lt as updateMechanic, p as createMechanicShift, q as listMechanicShifts, ut as updateMechanicDefaultPayoutPercent, w as deleteMechanic } from "./api-DUIXY4t-.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { n as useConfirm } from "./ConfirmDialog-ClPPfBvs.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { s as STATUS_LABELS } from "./types-0Ylr05H_.js";
import { o as ussLocalToInstant } from "./tz-BRzMydUb.js";
import { t as effectivePayout } from "./payouts-B59W4X07.js";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeDollarSign, CalendarClock, ChevronDown, ChevronRight, Pencil, Percent, Plus, Trash2, UserCog, Wallet } from "lucide-react";
import { toast } from "sonner";
//#region src/routes/mechanics.tsx?tsr-split=component
var COLORS = [
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#84cc16",
	"#22c55e",
	"#10b981",
	"#14b8a6",
	"#06b6d4",
	"#0ea5e9",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#d946ef",
	"#ec4899",
	"#f43f5e",
	"#78716c",
	"#0f172a",
	"#64748b",
	"#7c2d12",
	"#166534",
	"#1e3a8a",
	"#4a044e"
];
function MechanicsPage() {
	const qc = useQueryClient();
	const confirmAction = useConfirm();
	const { data: mechanics = [] } = useQuery({
		queryKey: ["mechanics"],
		queryFn: listMechanics
	});
	const [selectedId, setSelectedId] = useState(null);
	const [dialog, setDialog] = useState({
		open: false,
		editing: null
	});
	const [form, setForm] = useState({
		full_name: "",
		specialization: "",
		phone: "",
		color: COLORS[0]
	});
	const openNew = () => {
		setDialog({
			open: true,
			editing: null
		});
		setForm({
			full_name: "",
			specialization: "",
			phone: "",
			color: COLORS[mechanics.length % COLORS.length]
		});
	};
	const openEdit = (m) => {
		setDialog({
			open: true,
			editing: m
		});
		setForm({
			full_name: m.full_name,
			specialization: m.specialization ?? "",
			phone: m.phone ?? "",
			color: m.color
		});
	};
	const saveM = useMutation({
		mutationFn: async () => {
			if (!form.full_name.trim()) throw new Error("Введите ФИО");
			const payload = {
				full_name: form.full_name.trim(),
				specialization: form.specialization.trim() || null,
				phone: form.phone.trim() || null,
				color: form.color
			};
			if (dialog.editing) {
				await updateMechanic(dialog.editing.id, payload);
				return dialog.editing.id;
			}
			return (await createMechanic(payload)).id;
		},
		onSuccess: (id) => {
			toast.success("Сохранено");
			qc.invalidateQueries({ queryKey: ["mechanics"] });
			setDialog({
				open: false,
				editing: null
			});
			setSelectedId(id);
		},
		onError: (e) => toast.error(e.message)
	});
	const delM = useMutation({
		mutationFn: (id) => deleteMechanic(id),
		onSuccess: () => {
			toast.success("Удалено");
			qc.invalidateQueries({ queryKey: ["mechanics"] });
			setSelectedId(null);
		}
	});
	const selected = mechanics.find((m) => m.id === selectedId) ?? null;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-[calc(100vh-3rem)] flex-col md:h-[calc(100vh-3rem)] md:flex-row",
		children: [
			/* @__PURE__ */ jsxs("aside", {
				className: `w-full flex-col border-r bg-muted/30 md:flex md:w-72 ${selected ? "hidden md:flex" : "flex"}`,
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between border-b p-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "font-semibold",
						children: "Мастера"
					}), /* @__PURE__ */ jsxs(Button, {
						size: "sm",
						onClick: openNew,
						children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Добавить"]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex-1 overflow-auto",
					children: [mechanics.length === 0 && /* @__PURE__ */ jsx("div", {
						className: "p-6 text-center text-sm text-muted-foreground",
						children: "Пока нет мастеров"
					}), mechanics.map((m) => {
						const active = m.id === selectedId;
						return /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setSelectedId(m.id),
							className: "flex w-full items-center gap-3 border-b border-l-4 px-3 py-2.5 text-left text-sm transition hover:bg-muted/60",
							style: {
								borderLeftColor: m.color,
								background: active ? `${m.color}22` : void 0
							},
							children: [/* @__PURE__ */ jsx("span", {
								className: "h-4 w-4 shrink-0 rounded",
								style: { background: m.color }
							}), /* @__PURE__ */ jsxs("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsx("div", {
									className: "truncate font-medium",
									children: m.full_name
								}), /* @__PURE__ */ jsx("div", {
									className: "truncate text-xs text-muted-foreground",
									children: m.specialization ?? "—"
								})]
							})]
						}, m.id);
					})]
				})]
			}),
			/* @__PURE__ */ jsx("section", {
				className: `flex-1 overflow-auto p-4 md:p-6 ${!selected ? "hidden md:block" : "block"}`,
				children: !selected ? /* @__PURE__ */ jsx("div", {
					className: "flex h-full items-center justify-center text-muted-foreground",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center",
						children: [/* @__PURE__ */ jsx(UserCog, { className: "mx-auto mb-3 h-10 w-10 opacity-30" }), /* @__PURE__ */ jsx("div", { children: "Выберите мастера слева или добавьте нового" })]
					})
				}) : /* @__PURE__ */ jsxs("div", {
					className: "mx-auto max-w-3xl space-y-8",
					children: [
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setSelectedId(null),
							className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden",
							children: [/* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }), " К списку мастеров"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col items-start gap-3 rounded-lg border-l-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
							style: {
								borderLeftColor: selected.color,
								background: `${selected.color}10`
							},
							children: [/* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "inline-block h-4 w-4 shrink-0 rounded",
										style: { background: selected.color }
									}), /* @__PURE__ */ jsx("h1", {
										className: "truncate text-xl font-bold sm:text-2xl",
										children: selected.full_name
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground",
									children: [/* @__PURE__ */ jsx("span", { children: selected.specialization ?? "—" }), selected.phone && /* @__PURE__ */ jsxs("span", { children: ["· ", selected.phone] })]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ jsxs(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => openEdit(selected),
									children: [/* @__PURE__ */ jsx(Pencil, { className: "mr-1 h-4 w-4" }), "Изменить"]
								}), /* @__PURE__ */ jsx(Button, {
									variant: "outline",
									size: "sm",
									onClick: async () => {
										if (await confirmAction({
											title: "Удалить мастера?",
											description: `«${selected.full_name}». Восстановить нельзя.`,
											destructive: true,
											confirmText: "Удалить"
										})) delM.mutate(selected.id);
									},
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
								})]
							})]
						}),
						/* @__PURE__ */ jsx(MechanicDefaultPercent, { mechanic: selected }),
						/* @__PURE__ */ jsx(MechanicSalary, {
							mechanicId: selected.id,
							defaultPercent: Number(selected.default_payout_percent ?? 50)
						}),
						/* @__PURE__ */ jsx(MechanicAdvances, { mechanicId: selected.id }),
						/* @__PURE__ */ jsx(MechanicRates, { mechanicId: selected.id }),
						/* @__PURE__ */ jsx(MechanicShifts, {
							mechanicId: selected.id,
							color: selected.color
						})
					]
				})
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: dialog.open,
				onOpenChange: (o) => setDialog((s) => ({
					...s,
					open: o
				})),
				children: /* @__PURE__ */ jsxs(DialogContent, { children: [
					/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: dialog.editing ? "Редактировать мастера" : "Новый мастер" }) }),
					/* @__PURE__ */ jsxs("div", {
						className: "grid gap-3",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "ФИО" }), /* @__PURE__ */ jsx(Input, {
								value: form.full_name,
								onChange: (e) => setForm({
									...form,
									full_name: e.target.value
								})
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Специализация" }), /* @__PURE__ */ jsx(Input, {
								value: form.specialization,
								onChange: (e) => setForm({
									...form,
									specialization: e.target.value
								})
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Телефон" }), /* @__PURE__ */ jsx(Input, {
								value: form.phone,
								onChange: (e) => setForm({
									...form,
									phone: e.target.value
								})
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Цвет в календаре" }), /* @__PURE__ */ jsx("div", {
								className: "mt-2 grid grid-cols-8 gap-2",
								children: COLORS.map((c) => /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setForm({
										...form,
										color: c
									}),
									className: `h-8 w-8 rounded-md border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`,
									style: { background: c }
								}, c))
							})] })
						]
					}),
					/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						onClick: () => setDialog({
							open: false,
							editing: null
						}),
						children: "Отмена"
					}), /* @__PURE__ */ jsx(Button, {
						onClick: () => saveM.mutate(),
						children: "Сохранить"
					})] })
				] })
			})
		]
	});
}
var PERIOD_LABELS = {
	today: "Сегодня",
	week: "Неделя",
	month: "Месяц",
	all: "Всё время"
};
function periodStart(p) {
	const now = /* @__PURE__ */ new Date();
	if (p === "all") return 0;
	if (p === "today") {
		const d = new Date(now);
		d.setHours(0, 0, 0, 0);
		return d.getTime();
	}
	if (p === "week") return now.getTime() - 10080 * 60 * 1e3;
	return now.getTime() - 720 * 60 * 60 * 1e3;
}
function MechanicDefaultPercent({ mechanic }) {
	const qc = useQueryClient();
	const confirm = useConfirm();
	const [value, setValue] = useState(String(mechanic.default_payout_percent ?? 50));
	const invalidateMoney = () => {
		qc.invalidateQueries({ queryKey: ["mechanics"] });
		qc.invalidateQueries({ queryKey: ["mechanic-payouts"] });
		qc.invalidateQueries({ queryKey: ["appointments"] });
		qc.invalidateQueries({ queryKey: ["expenses"] });
	};
	const monthStartISO = (() => {
		const d = /* @__PURE__ */ new Date();
		const y = Number(new Intl.DateTimeFormat("ru-RU", {
			timeZone: "Asia/Vladivostok",
			year: "numeric"
		}).format(d));
		const m = Number(new Intl.DateTimeFormat("ru-RU", {
			timeZone: "Asia/Vladivostok",
			month: "numeric"
		}).format(d));
		return ussLocalToInstant(`${y}-${String(m).padStart(2, "0")}-01`, "00:00").toISOString();
	})();
	const recalcM = useMutation({
		mutationFn: async (v) => recalcMechanicPayouts(mechanic.id, v.percent, v.all ? { skipPaid: true } : {
			onlyFrom: monthStartISO,
			skipPaid: true
		}),
		onSuccess: (changed) => {
			invalidateMoney();
			toast.success(changed > 0 ? `Пересчитано услуг: ${changed}` : "Все выплаты уже соответствуют проценту");
		},
		onError: (e) => toast.error(e.message)
	});
	const saveM = useMutation({
		mutationFn: async (n) => updateMechanicDefaultPayoutPercent(mechanic.id, n),
		onSuccess: async (_d, n) => {
			invalidateMoney();
			toast.success("Процент сохранён");
			if (await confirm({
				title: "Пересчитать выплаты за текущий месяц?",
				description: `Записи текущего месяца будут пересчитаны под ${n}%. Закрытые (полностью оплаченные) записи и прошлые месяцы останутся без изменений. Новые услуги сразу считаются по новому проценту.`,
				confirmText: "Пересчитать",
				cancelText: "Не сейчас"
			})) recalcM.mutate({
				percent: n,
				all: false
			});
		},
		onError: (e) => toast.error(e.message)
	});
	const currentPercent = Number(mechanic.default_payout_percent ?? 50);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ jsx(Percent, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				className: "text-sm font-medium",
				children: "Процент по умолчанию"
			}), /* @__PURE__ */ jsx("div", {
				className: "text-xs text-muted-foreground",
				children: "Применяется, если нет индивидуальной ставки за услугу"
			})] })]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ jsx(Input, {
					type: "number",
					className: "h-9 w-24",
					value,
					onChange: (e) => setValue(e.target.value),
					onBlur: () => {
						const n = Number(value);
						if (!Number.isFinite(n) || n < 0 || n > 100) {
							setValue(String(currentPercent));
							return;
						}
						if (n !== currentPercent) saveM.mutate(n);
					}
				}),
				/* @__PURE__ */ jsx("span", {
					className: "text-sm text-muted-foreground",
					children: "%"
				}),
				/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					size: "sm",
					disabled: recalcM.isPending,
					onClick: () => recalcM.mutate({
						percent: currentPercent,
						all: false
					}),
					children: recalcM.isPending ? "Пересчёт…" : "Пересчитать за месяц"
				}),
				/* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "sm",
					disabled: recalcM.isPending,
					onClick: async () => {
						if (await confirm({
							title: "Пересчитать все записи?",
							description: `Будут пересчитаны все НЕоплаченные и частично оплаченные записи мастера под ${currentPercent}%, включая прошлые месяцы. Полностью оплаченные записи не трогаем. Ручные правки сумм будут перезаписаны.`,
							confirmText: "Пересчитать всё"
						})) recalcM.mutate({
							percent: currentPercent,
							all: true
						});
					},
					children: "Пересчитать всё"
				})
			]
		})]
	});
}
function MechanicSalary({ mechanicId, defaultPercent }) {
	const { data: rows = [] } = useQuery({
		queryKey: ["mechanic-payouts", mechanicId],
		queryFn: () => listMechanicPayouts(mechanicId)
	});
	const { data: services = [] } = useQuery({
		queryKey: ["services"],
		queryFn: listServices
	});
	const { data: advances = [] } = useQuery({
		queryKey: ["mechanic-advances", mechanicId],
		queryFn: () => listMechanicAdvances({ mechanic_id: mechanicId })
	});
	const [period, setPeriod] = useState("month");
	const [expanded, setExpanded] = useState(/* @__PURE__ */ new Set());
	const mechForPayout = { default_payout_percent: defaultPercent > 0 ? defaultPercent : null };
	const svcById = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		services.forEach((s) => m.set(s.id, { default_payout_percent: s.default_payout_percent ?? null }));
		return m;
	}, [services]);
	const effPayout = (r) => effectivePayout({
		storedPayout: r.mechanic_payout,
		price: r.price,
		mechanic: mechForPayout,
		service: r.service_id ? svcById.get(r.service_id) ?? null : null
	});
	const filtered = useMemo(() => {
		const start = periodStart(period);
		return rows.filter((r) => r.status === "done" && new Date(r.starts_at).getTime() >= start).sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
	}, [rows, period]);
	const advancesInPeriod = useMemo(() => {
		const start = periodStart(period);
		return advances.filter((a) => new Date(a.paid_at).getTime() >= start);
	}, [advances, period]);
	const pending = useMemo(() => rows.filter((r) => r.status !== "done" && r.status !== "cancelled"), [rows]);
	const totalRevenue = filtered.reduce((s, r) => s + r.price, 0);
	const totalPayout = filtered.reduce((s, r) => s + effPayout(r), 0);
	const avgPercent = totalRevenue > 0 ? Math.round(totalPayout / totalRevenue * 100) : 0;
	const pendingTotal = pending.reduce((s, r) => s + effPayout(r), 0);
	const advTotal = advancesInPeriod.reduce((s, a) => s + Number(a.amount ?? 0), 0);
	const toPay = totalPayout - advTotal;
	const toggle = (key) => setExpanded((prev) => {
		const n = new Set(prev);
		if (n.has(key)) n.delete(key);
		else n.add(key);
		return n;
	});
	const fmt = (n) => `${n.toLocaleString("ru-RU")} ₽`;
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex flex-wrap items-center justify-between gap-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx(Wallet, { className: "h-5 w-5" }), /* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold",
					children: "Зарплата"
				})]
			}), /* @__PURE__ */ jsxs(Select, {
				value: period,
				onValueChange: (v) => setPeriod(v),
				children: [/* @__PURE__ */ jsx(SelectTrigger, {
					className: "w-32 sm:w-40",
					children: /* @__PURE__ */ jsx(SelectValue, {})
				}), /* @__PURE__ */ jsx(SelectContent, { children: Object.keys(PERIOD_LABELS).map((p) => /* @__PURE__ */ jsx(SelectItem, {
					value: p,
					children: PERIOD_LABELS[p]
				}, p)) })]
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "rounded-lg border bg-card p-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: "Оборот по услугам"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-1 text-2xl font-bold",
							children: fmt(totalRevenue)
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [filtered.length, " услуг"]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "rounded-lg border bg-card p-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: "Начислено ЗП"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-1 text-2xl font-bold",
							children: fmt(totalPayout)
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [
								"≈ ",
								avgPercent,
								"% от оборота"
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "rounded-lg border bg-card p-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: "К выплате"
						}),
						/* @__PURE__ */ jsx("div", {
							className: `mt-1 text-2xl font-bold ${toPay < 0 ? "text-destructive" : ""}`,
							children: fmt(toPay)
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [
								fmt(totalPayout),
								" начислено − ",
								fmt(advTotal),
								" аванс",
								toPay < 0 ? " · переплата авансами" : ""
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "rounded-lg border bg-card p-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: "Ожидает (в работе / запланировано)"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-1 text-2xl font-bold",
							children: fmt(pendingTotal)
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [pending.length, " услуг"]
						})
					]
				})
			]
		}),
		filtered.length > 0 && /* @__PURE__ */ jsx("div", {
			className: "mt-3 space-y-1",
			children: filtered.map((r, i) => {
				const key = `${r.appointment_id}:${r.service_id}:${i}`;
				const open = expanded.has(key);
				const dt = new Date(r.starts_at);
				const payout = effPayout(r);
				const pctRow = r.price > 0 ? Math.round(payout / r.price * 100) : 0;
				return /* @__PURE__ */ jsxs("div", {
					className: "rounded border bg-card",
					children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => toggle(key),
						className: "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted/40",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex min-w-0 items-center gap-2",
							children: [
								open ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }),
								/* @__PURE__ */ jsx("span", {
									className: "truncate font-medium",
									children: r.service_name ?? "—"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "hidden text-muted-foreground sm:inline",
									children: dt.toLocaleDateString("ru-RU")
								}),
								r.client_name && /* @__PURE__ */ jsxs("span", {
									className: "hidden truncate text-muted-foreground md:inline",
									children: ["· ", r.client_name]
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex shrink-0 items-center gap-3",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "text-muted-foreground",
									children: [r.price, " ₽"]
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "font-semibold",
									children: [payout, " ₽"]
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "hidden w-10 text-right text-muted-foreground sm:inline",
									children: [pctRow, "%"]
								})
							]
						})]
					}), open && /* @__PURE__ */ jsx("div", {
						className: "border-t bg-muted/20 px-3 py-2 text-xs",
						children: /* @__PURE__ */ jsxs("div", {
							className: "grid gap-1 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
									className: "text-muted-foreground",
									children: "Клиент: "
								}), /* @__PURE__ */ jsx("span", {
									className: "font-medium",
									children: r.client_name ?? "—"
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
									className: "text-muted-foreground",
									children: "Машина: "
								}), /* @__PURE__ */ jsxs("span", {
									className: "font-medium",
									children: [r.car_label ?? "—", r.license_plate ? ` · ${r.license_plate}` : ""]
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
									className: "text-muted-foreground",
									children: "Когда: "
								}), /* @__PURE__ */ jsxs("span", { children: [
									dt.toLocaleDateString("ru-RU"),
									" ·",
									" ",
									dt.toLocaleTimeString("ru-RU", {
										hour: "2-digit",
										minute: "2-digit"
									})
								] })] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
									className: "text-muted-foreground",
									children: "Статус: "
								}), /* @__PURE__ */ jsx("span", { children: STATUS_LABELS[r.status] ?? r.status })] }),
								r.appointment_comment && /* @__PURE__ */ jsxs("div", {
									className: "sm:col-span-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "Комментарий: "
									}), /* @__PURE__ */ jsx("span", { children: r.appointment_comment })]
								})
							]
						})
					})]
				}, key);
			})
		})
	] });
}
function MechanicAdvances({ mechanicId }) {
	const qc = useQueryClient();
	const confirmActionCtx = useConfirm();
	const [period, setPeriod] = useState("month");
	const [open, setOpen] = useState(false);
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const [form, setForm] = useState({
		paid_at: today,
		amount: "",
		note: ""
	});
	const { data: advances = [] } = useQuery({
		queryKey: ["mechanic-advances", mechanicId],
		queryFn: () => listMechanicAdvances({ mechanic_id: mechanicId })
	});
	const filtered = useMemo(() => {
		const start = periodStart(period);
		return advances.filter((a) => new Date(a.paid_at).getTime() >= start);
	}, [advances, period]);
	const total = filtered.reduce((s, a) => s + Number(a.amount ?? 0), 0);
	const create = useMutation({
		mutationFn: async () => {
			const n = Number(form.amount);
			if (!Number.isFinite(n) || n <= 0) throw new Error("Введите сумму");
			await createMechanicAdvance({
				mechanic_id: mechanicId,
				paid_at: form.paid_at,
				amount: n,
				note: form.note.trim() || null
			});
		},
		onSuccess: () => {
			toast.success("Аванс добавлен");
			qc.invalidateQueries({ queryKey: ["mechanic-advances", mechanicId] });
			qc.invalidateQueries({ queryKey: ["mechanic_advances"] });
			setOpen(false);
			setForm({
				paid_at: today,
				amount: "",
				note: ""
			});
		},
		onError: (e) => toast.error(e.message)
	});
	const del = useMutation({
		mutationFn: (id) => deleteMechanicAdvance(id),
		onSuccess: () => {
			toast.success("Удалено");
			qc.invalidateQueries({ queryKey: ["mechanic-advances", mechanicId] });
			qc.invalidateQueries({ queryKey: ["mechanic_advances"] });
		}
	});
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex flex-wrap items-center justify-between gap-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx(BadgeDollarSign, { className: "h-5 w-5" }), /* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold",
					children: "Авансы"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsxs(Select, {
					value: period,
					onValueChange: (v) => setPeriod(v),
					children: [/* @__PURE__ */ jsx(SelectTrigger, {
						className: "w-32 sm:w-40",
						children: /* @__PURE__ */ jsx(SelectValue, {})
					}), /* @__PURE__ */ jsx(SelectContent, { children: Object.keys(PERIOD_LABELS).map((p) => /* @__PURE__ */ jsx(SelectItem, {
						value: p,
						children: PERIOD_LABELS[p]
					}, p)) })]
				}), /* @__PURE__ */ jsxs(Button, {
					size: "sm",
					onClick: () => setOpen(true),
					children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Аванс"]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "rounded-lg border bg-card p-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "text-xs text-muted-foreground",
					children: [
						"Выдано авансов (",
						PERIOD_LABELS[period].toLowerCase(),
						")"
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-1 text-2xl font-bold",
					children: [total.toLocaleString("ru-RU"), " ₽"]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [filtered.length, " выплат"]
				})
			]
		}),
		filtered.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "mt-3 rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground",
			children: "Авансов нет"
		}) : /* @__PURE__ */ jsx("div", {
			className: "mt-3 space-y-1",
			children: filtered.map((a) => /* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-2 rounded border bg-card px-3 py-1.5 text-xs",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ jsx("span", {
						className: "font-medium",
						children: new Date(a.paid_at).toLocaleDateString("ru-RU")
					}), a.note && /* @__PURE__ */ jsxs("span", {
						className: "ml-2 text-muted-foreground",
						children: ["· ", a.note]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex shrink-0 items-center gap-2",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "font-semibold",
						children: [Number(a.amount).toLocaleString("ru-RU"), " ₽"]
					}), /* @__PURE__ */ jsx(Button, {
						size: "icon",
						variant: "ghost",
						className: "h-7 w-7",
						onClick: () => {
							(async () => {
								if (await confirmActionCtx({
									title: "Удалить аванс?",
									description: `${new Date(a.paid_at).toLocaleDateString("ru-RU")} · ${Number(a.amount).toLocaleString("ru-RU")} ₽`,
									destructive: true,
									confirmText: "Удалить"
								})) del.mutate(a.id);
							})();
						},
						children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
					})]
				})]
			}, a.id))
		}),
		/* @__PURE__ */ jsx(Dialog, {
			open,
			onOpenChange: setOpen,
			children: /* @__PURE__ */ jsxs(DialogContent, { children: [
				/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Новый аванс" }) }),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-3",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Дата" }), /* @__PURE__ */ jsx(Input, {
							type: "date",
							value: form.paid_at,
							onChange: (e) => setForm({
								...form,
								paid_at: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Сумма, ₽" }), /* @__PURE__ */ jsx(Input, {
							type: "number",
							value: form.amount,
							onChange: (e) => setForm({
								...form,
								amount: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Примечание" }), /* @__PURE__ */ jsx(Input, {
							value: form.note,
							onChange: (e) => setForm({
								...form,
								note: e.target.value
							}),
							placeholder: "Необязательно"
						})] })
					]
				}),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: () => setOpen(false),
					children: "Отмена"
				}), /* @__PURE__ */ jsx(Button, {
					onClick: () => create.mutate(),
					disabled: create.isPending,
					children: "Сохранить"
				})] })
			] })
		})
	] });
}
function MechanicRates({ mechanicId }) {
	const qc = useQueryClient();
	const { data: services = [] } = useQuery({
		queryKey: ["services"],
		queryFn: listServices
	});
	const { data: rates = [] } = useQuery({
		queryKey: ["mechanic-service-rates", mechanicId],
		queryFn: () => listMechanicServiceRates(mechanicId)
	});
	const rateFor = (svcId) => rates.find((r) => r.service_id === svcId)?.amount ?? 0;
	const [drafts, setDrafts] = useState({});
	const saveM = useMutation({
		mutationFn: async ({ service_id, amount }) => {
			await upsertMechanicServiceRate(mechanicId, service_id, amount);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["mechanic-service-rates", mechanicId] });
			toast.success("Ставка сохранена");
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
		className: "mb-3 flex items-center gap-2",
		children: [/* @__PURE__ */ jsx(UserCog, { className: "h-5 w-5" }), /* @__PURE__ */ jsx("h2", {
			className: "text-lg font-semibold",
			children: "Ставки за услуги"
		})]
	}), services.length === 0 ? /* @__PURE__ */ jsx("div", {
		className: "rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground",
		children: "Сначала добавьте услуги в «Настройках калькулятора»"
	}) : /* @__PURE__ */ jsx("div", {
		className: "rounded-lg border bg-card",
		children: services.map((s) => {
			const draftKey = s.id;
			const current = rateFor(s.id);
			const value = drafts[draftKey] ?? String(current);
			return /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3 border-b p-2 last:border-b-0",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "min-w-0 flex-1 text-sm",
						children: [/* @__PURE__ */ jsx("div", {
							className: "truncate font-medium",
							children: s.name
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-xs text-muted-foreground",
							children: [
								s.category,
								" · клиенту ",
								s.base_price,
								" ₽"
							]
						})]
					}),
					/* @__PURE__ */ jsx(Input, {
						type: "number",
						className: "h-8 w-28",
						value,
						onChange: (e) => setDrafts((d) => ({
							...d,
							[draftKey]: e.target.value
						})),
						onBlur: () => {
							const n = Number(value);
							if (Number.isFinite(n) && n !== current) saveM.mutate({
								service_id: s.id,
								amount: n
							});
							setDrafts((d) => {
								const { [draftKey]: _, ...rest } = d;
								return rest;
							});
						}
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-xs text-muted-foreground",
						children: "₽"
					})
				]
			}, s.id);
		})
	})] });
}
function MechanicShifts({ mechanicId, color = "#64748b" }) {
	const qc = useQueryClient();
	const confirmActionCtx = useConfirm();
	const { data: shifts = [] } = useQuery({
		queryKey: ["mechanic-shifts", mechanicId],
		queryFn: () => listMechanicShifts(mechanicId)
	});
	const grouped = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		for (const s of shifts) {
			const d = new Date(s.starts_at);
			const monOffset = (d.getDay() + 6) % 7;
			const monday = new Date(d);
			monday.setHours(0, 0, 0, 0);
			monday.setDate(monday.getDate() - monOffset);
			const key = monday.toISOString().slice(0, 10);
			if (!map.has(key)) map.set(key, []);
			map.get(key).push(s);
		}
		return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
	}, [shifts]);
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [form, setForm] = useState({
		start: "",
		end: "",
		note: ""
	});
	const openNew = () => {
		setEditing(null);
		const d = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		setForm({
			start: `${d}T09:00`,
			end: `${d}T18:00`,
			note: ""
		});
		setOpen(true);
	};
	const openEdit = (s) => {
		setEditing(s);
		setForm({
			start: new Date(s.starts_at).toISOString().slice(0, 16),
			end: new Date(s.ends_at).toISOString().slice(0, 16),
			note: s.note ?? ""
		});
		setOpen(true);
	};
	const invalidate = () => qc.invalidateQueries({ queryKey: ["mechanic-shifts", mechanicId] });
	const saveM = useMutation({
		mutationFn: async () => {
			if (!form.start || !form.end) throw new Error("Укажите время начала и окончания");
			const starts_at = new Date(form.start).toISOString();
			const ends_at = new Date(form.end).toISOString();
			if (new Date(ends_at).getTime() <= new Date(starts_at).getTime()) throw new Error("Конец должен быть позже начала");
			const payload = {
				mechanic_id: mechanicId,
				starts_at,
				ends_at,
				note: form.note.trim() || null
			};
			if (editing) {
				const { updateMechanicShift } = await import("./api-DUIXY4t-.js").then((n) => n.t);
				await updateMechanicShift(editing.id, payload);
			} else await createMechanicShift(payload);
		},
		onSuccess: () => {
			toast.success("Сохранено");
			invalidate();
			setOpen(false);
		},
		onError: (e) => toast.error(e.message)
	});
	const delM = useMutation({
		mutationFn: (id) => deleteMechanicShift(id),
		onSuccess: () => {
			toast.success("Удалено");
			invalidate();
		}
	});
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex items-center justify-between",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx(CalendarClock, { className: "h-5 w-5" }), /* @__PURE__ */ jsxs("h2", {
					className: "text-lg font-semibold",
					children: [
						"График смен",
						" ",
						/* @__PURE__ */ jsxs("span", {
							className: "text-sm font-normal text-muted-foreground",
							children: ["· ", shifts.length]
						})
					]
				})]
			}), /* @__PURE__ */ jsxs(Button, {
				size: "sm",
				onClick: openNew,
				children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Смена"]
			})]
		}),
		shifts.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground",
			children: "Смен пока нет"
		}) : /* @__PURE__ */ jsx("div", {
			className: "space-y-5",
			children: grouped.map(([weekKey, weekShifts]) => {
				const weekStart = new Date(weekKey);
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekEnd.getDate() + 6);
				const totalMin = weekShifts.reduce((s, sh) => s + Math.round((new Date(sh.ends_at).getTime() - new Date(sh.starts_at).getTime()) / 6e4), 0);
				const totalH = Math.round(totalMin / 60 * 10) / 10;
				return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground",
					children: [/* @__PURE__ */ jsxs("span", { children: [
						"Неделя с",
						" ",
						weekStart.toLocaleDateString("ru-RU", {
							day: "2-digit",
							month: "short"
						}),
						" – ",
						weekEnd.toLocaleDateString("ru-RU", {
							day: "2-digit",
							month: "short"
						})
					] }), /* @__PURE__ */ jsxs("span", { children: [
						"Всего: ",
						totalH,
						" ч"
					] })]
				}), /* @__PURE__ */ jsx("div", {
					className: "space-y-2",
					children: weekShifts.map((s) => {
						const start = new Date(s.starts_at);
						const end = new Date(s.ends_at);
						const past = end.getTime() < Date.now();
						const durH = Math.round((end.getTime() - start.getTime()) / 36e5 * 10) / 10;
						return /* @__PURE__ */ jsxs("div", {
							className: `flex items-center justify-between rounded-lg border border-l-4 bg-card p-3 text-sm ${past ? "opacity-60" : ""}`,
							style: {
								borderLeftColor: color,
								background: past ? void 0 : `${color}0d`
							},
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
								className: "font-medium",
								children: [
									start.toLocaleDateString("ru-RU", {
										weekday: "short",
										day: "2-digit",
										month: "short"
									}),
									" · ",
									start.toLocaleTimeString("ru-RU", {
										hour: "2-digit",
										minute: "2-digit"
									}),
									" – ",
									end.toLocaleTimeString("ru-RU", {
										hour: "2-digit",
										minute: "2-digit"
									}),
									/* @__PURE__ */ jsxs("span", {
										className: "ml-2 text-xs font-normal text-muted-foreground",
										children: [durH, " ч"]
									})
								]
							}), s.note && /* @__PURE__ */ jsx("div", {
								className: "text-xs text-muted-foreground",
								children: s.note
							})] }), /* @__PURE__ */ jsxs("div", {
								className: "flex gap-1",
								children: [/* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => openEdit(s),
									children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" })
								}), /* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => {
										(async () => {
											if (await confirmActionCtx({
												title: "Удалить смену?",
												destructive: true,
												confirmText: "Удалить"
											})) delM.mutate(s.id);
										})();
									},
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
								})]
							})]
						}, s.id);
					})
				})] }, weekKey);
			})
		}),
		/* @__PURE__ */ jsx(Dialog, {
			open,
			onOpenChange: setOpen,
			children: /* @__PURE__ */ jsxs(DialogContent, { children: [
				/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editing ? "Редактировать смену" : "Новая смена" }) }),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-3",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Начало" }), /* @__PURE__ */ jsx(Input, {
							type: "datetime-local",
							value: form.start,
							onChange: (e) => setForm({
								...form,
								start: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Конец" }), /* @__PURE__ */ jsx(Input, {
							type: "datetime-local",
							value: form.end,
							onChange: (e) => setForm({
								...form,
								end: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Заметка" }), /* @__PURE__ */ jsx(Input, {
							value: form.note,
							onChange: (e) => setForm({
								...form,
								note: e.target.value
							}),
							placeholder: "Необязательно"
						})] })
					]
				}),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: () => setOpen(false),
					children: "Отмена"
				}), /* @__PURE__ */ jsx(Button, {
					onClick: () => saveM.mutate(),
					disabled: saveM.isPending,
					children: "Сохранить"
				})] })
			] })
		})
	] });
}
//#endregion
export { MechanicsPage as component };
