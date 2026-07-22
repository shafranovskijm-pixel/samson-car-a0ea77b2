import { H as listMechanicAdvances, K as listMechanics, P as listAppointments, S as deleteExpense, V as listExpenses, X as listServices, f as createMechanicAdvance, q as listPaymentsRange, u as createExpense, w as deleteMechanicAdvance } from "./api-BaCLxPcN.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-D9xGQQQw.js";
import { n as CardContent, t as Card } from "./card-BXjpJ96D.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { t as Textarea } from "./textarea-kko37XEX.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { t as Badge } from "./badge-D1Dupn2y.js";
import { t as effectivePayout } from "./payouts-B1J-S6a6.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.js";
import * as React from "react";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
//#region src/components/ui/accordion.tsx
var Accordion = AccordionPrimitive.Root;
var AccordionItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Item, {
	ref,
	className: cn("border-b", className),
	...props
}));
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, {
	className: "flex",
	children: /* @__PURE__ */ jsxs(AccordionPrimitive.Trigger, {
		ref,
		className: cn("flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180", className),
		...props,
		children: [children, /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" })]
	})
}));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Content, {
	ref,
	className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
	...props,
	children: /* @__PURE__ */ jsx("div", {
		className: cn("pb-4 pt-0", className),
		children
	})
}));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
//#endregion
//#region src/routes/expenses.tsx?tsr-split=component
var fmt = (n) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";
var isoDate = (d) => format(d, "yyyy-MM-dd");
function ExpensesPage() {
	const [month, setMonth] = useState(() => startOfMonth(/* @__PURE__ */ new Date()));
	const monthStart = useMemo(() => startOfMonth(month), [month]);
	const monthEnd = useMemo(() => endOfMonth(month), [month]);
	const fromIso = isoDate(monthStart);
	const toIso = isoDate(monthEnd);
	const { data: appts = [] } = useQuery({
		queryKey: [
			"appointments",
			"expenses-month",
			fromIso,
			toIso
		],
		queryFn: () => listAppointments(monthStart, monthEnd)
	});
	const { data: expenses = [] } = useQuery({
		queryKey: [
			"expenses",
			fromIso,
			toIso
		],
		queryFn: () => listExpenses(fromIso, toIso)
	});
	const { data: mechanics = [] } = useQuery({
		queryKey: ["mechanics"],
		queryFn: () => listMechanics()
	});
	const { data: advances = [] } = useQuery({
		queryKey: [
			"mechanic_advances",
			fromIso,
			toIso
		],
		queryFn: () => listMechanicAdvances({
			from: fromIso,
			to: toIso
		})
	});
	const { data: payments = [] } = useQuery({
		queryKey: [
			"payments-range",
			fromIso,
			toIso
		],
		queryFn: () => listPaymentsRange(fromIso, toIso)
	});
	const doneAppts = useMemo(() => appts.filter((a) => a.status === "done"), [appts]);
	const upcomingAppts = useMemo(() => appts.filter((a) => a.status !== "done" && a.status !== "cancelled"), [appts]);
	const { data: servicesList = [] } = useQuery({
		queryKey: ["services"],
		queryFn: () => listServices()
	});
	const mechById = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		mechanics.forEach((x) => m.set(x.id, { default_payout_percent: x.default_payout_percent ?? null }));
		return m;
	}, [mechanics]);
	const svcById = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		servicesList.forEach((s) => m.set(s.id, { default_payout_percent: s.default_payout_percent ?? null }));
		return m;
	}, [servicesList]);
	const effPayout = (mechanicId, price, stored, serviceId) => effectivePayout({
		storedPayout: stored,
		price,
		mechanic: mechanicId ? mechById.get(mechanicId) ?? null : null,
		service: serviceId ? svcById.get(serviceId) ?? null : null
	});
	const apptPayout = (a) => (a.services ?? []).reduce((s, x) => s + effPayout(a.mechanic_id, Number(x.price ?? 0), Number(x.mechanic_payout ?? 0), x.service_id), 0);
	const revenue = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
	const unpaidBalance = doneAppts.reduce((s, a) => s + Math.max(0, (a.total_price ?? 0) - Number(a.paid_amount ?? 0)), 0);
	const expectedIncome = upcomingAppts.reduce((s, a) => s + Math.max(0, (a.total_price ?? 0) - Number(a.paid_amount ?? 0)), 0);
	const expectedCount = upcomingAppts.length;
	const mechanicsAccrued = doneAppts.reduce((s, a) => s + apptPayout(a), 0);
	const mechanicsPaid = advances.reduce((s, a) => s + Number(a.amount ?? 0), 0);
	const accruedRevenue = doneAppts.reduce((s, a) => s + Number(a.total_price ?? 0), 0);
	const otherExpenses = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
	const cashProfit = revenue - mechanicsAccrued - otherExpenses;
	accruedRevenue - mechanicsAccrued - otherExpenses;
	const mechanicsDebt = mechanicsAccrued - mechanicsPaid;
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-7xl px-4 py-6 sm:px-6",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:mb-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "truncate text-xl font-bold sm:text-2xl",
						children: "Расходы"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-0.5 truncate text-xs text-muted-foreground sm:text-sm",
						children: "Оборот, прибыль, ЗП мастеров и авансы за месяц"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "shrink-0",
					children: /* @__PURE__ */ jsx(MonthPicker, {
						month,
						setMonth
					})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(Card, {
						className: `border-2 ${cashProfit >= 0 ? "border-green-500/30" : "border-red-500/30"} sm:col-span-2 lg:col-span-1`,
						children: /* @__PURE__ */ jsxs(CardContent, {
							className: "flex h-full flex-col p-4 sm:p-5",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
								children: "Чистая прибыль"
							}), /* @__PURE__ */ jsx("div", {
								className: `mt-1.5 text-xl font-bold tracking-tight tabular-nums sm:text-2xl ${cashProfit >= 0 ? "text-green-600" : "text-red-600"}`,
								children: fmt(cashProfit)
							})]
						})
					}),
					/* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
						className: "flex h-full flex-col p-4 sm:p-5",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
								children: "Доходы"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-1.5 truncate text-2xl font-bold",
								children: fmt(revenue)
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-1 text-[11px] text-muted-foreground",
								children: "Оборот кассы (платежи за месяц)"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-auto grid grid-cols-2 gap-3 border-t pt-3",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Ожидается"
										}),
										/* @__PURE__ */ jsx("div", {
											className: "mt-0.5 truncate text-sm font-semibold",
											children: fmt(expectedIncome)
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "truncate text-[10px] text-muted-foreground",
											children: [
												expectedCount,
												" запис",
												expectedCount === 1 ? "ь" : expectedCount > 1 && expectedCount < 5 ? "и" : "ей"
											]
										})
									]
								}), /* @__PURE__ */ jsxs("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Ждём оплату"
										}),
										/* @__PURE__ */ jsx("div", {
											className: `mt-0.5 truncate text-sm font-semibold ${unpaidBalance > 0 ? "text-amber-600" : ""}`,
											children: fmt(unpaidBalance)
										}),
										/* @__PURE__ */ jsx("div", {
											className: "truncate text-[10px] text-muted-foreground",
											children: "по работам месяца"
										})
									]
								})]
							})
						]
					}) }),
					/* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
						className: "flex h-full flex-col p-4 sm:p-5",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
								children: "Зарплаты (мастера)"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-1.5 truncate text-2xl font-bold text-amber-600",
								children: fmt(mechanicsAccrued)
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-1 text-[11px] text-muted-foreground",
								children: "Начислено в этом периоде"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-auto border-t pt-3",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: "min-w-0 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
											children: mechanicsDebt >= 0 ? "К выплате" : "Переплата"
										}), /* @__PURE__ */ jsx("span", {
											className: `shrink-0 text-sm font-semibold ${mechanicsDebt > 0 ? "text-amber-600" : mechanicsDebt < 0 ? "text-red-600" : "text-green-600"}`,
											children: fmt(Math.abs(mechanicsDebt))
										})]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-2 h-1 w-full overflow-hidden rounded-full bg-muted",
										children: /* @__PURE__ */ jsx("div", {
											className: "h-full bg-amber-500 transition-all",
											style: { width: `${mechanicsAccrued > 0 ? Math.min(100, Math.round(mechanicsPaid / mechanicsAccrued * 100)) : 0}%` }
										})
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-1 truncate text-[10px] text-muted-foreground",
										children: ["выплачено ", fmt(mechanicsPaid)]
									})
								]
							})
						]
					}) }),
					/* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
						className: "flex h-full flex-col p-4 sm:p-5",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
								children: "Прочие расходы"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-1.5 truncate text-2xl font-bold text-amber-600",
								children: fmt(otherExpenses)
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-1 text-[11px] text-muted-foreground",
								children: "Аренда, налоги, расходники"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-auto pt-3",
								children: /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => document.getElementById("expenses-block")?.scrollIntoView({
										behavior: "smooth",
										block: "start"
									}),
									className: "inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-amber-600",
									children: ["Подробнее", /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" })]
								})
							})
						]
					}) })
				]
			}),
			/* @__PURE__ */ jsxs(Tabs, {
				defaultValue: "summary",
				children: [
					/* @__PURE__ */ jsxs(TabsList, { children: [
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "summary",
							children: "Сводка"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "mechanics",
							children: "По мастерам"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "services",
							children: "По услугам"
						})
					] }),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "summary",
						className: "mt-4",
						children: /* @__PURE__ */ jsx(ExpensesBlock, {
							expenses,
							fromIso,
							toIso,
							defaultDate: fromIso
						})
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "mechanics",
						className: "mt-4",
						children: /* @__PURE__ */ jsx(MechanicsBlock, {
							mechanics,
							appts: doneAppts,
							advances,
							fromIso,
							toIso,
							apptPayout,
							effPayout
						})
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "services",
						className: "mt-4",
						children: /* @__PURE__ */ jsx(ServicesBlock, {
							appts: doneAppts,
							effPayout
						})
					})
				]
			})
		]
	});
}
function MonthPicker({ month, setMonth }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2 rounded-lg border bg-card px-2 py-1",
		children: [
			/* @__PURE__ */ jsx(Button, {
				variant: "ghost",
				size: "icon",
				onClick: () => setMonth(addMonths(month, -1)),
				children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "min-w-[140px] text-center text-sm font-medium capitalize",
				children: format(month, "LLLL yyyy", { locale: ru })
			}),
			/* @__PURE__ */ jsx(Button, {
				variant: "ghost",
				size: "icon",
				onClick: () => setMonth(addMonths(month, 1)),
				children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ jsx(Button, {
				variant: "outline",
				size: "sm",
				className: "ml-1",
				onClick: () => setMonth(startOfMonth(/* @__PURE__ */ new Date())),
				children: "Сегодня"
			})
		]
	});
}
function ExpensesBlock({ expenses, fromIso, toIso, defaultDate }) {
	const qc = useQueryClient();
	const [open, setOpen] = useState(false);
	const [pendingDelete, setPendingDelete] = useState(null);
	const [form, setForm] = useState({
		spent_at: defaultDate,
		title: "",
		amount: "",
		note: ""
	});
	const invalidate = () => qc.invalidateQueries({ queryKey: [
		"expenses",
		fromIso,
		toIso
	] });
	const create = useMutation({
		mutationFn: () => createExpense({
			spent_at: form.spent_at,
			title: form.title.trim(),
			amount: Number(form.amount) || 0,
			note: form.note.trim() || null
		}),
		onSuccess: () => {
			invalidate();
			setOpen(false);
			setForm({
				spent_at: defaultDate,
				title: "",
				amount: "",
				note: ""
			});
			toast.success("Расход добавлен");
		},
		onError: (e) => toast.error(e.message)
	});
	const remove = useMutation({
		mutationFn: (id) => deleteExpense(id),
		onSuccess: () => {
			invalidate();
			setPendingDelete(null);
			toast.success("Удалено");
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs(Card, {
		id: "expenses-block",
		children: [
			/* @__PURE__ */ jsxs(CardContent, {
				className: "p-4 sm:p-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-4 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
						className: "text-base font-semibold sm:text-lg",
						children: "Прочие расходы"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted-foreground",
						children: "Всё, что не относится к ЗП мастеров"
					})] }), /* @__PURE__ */ jsxs(Button, {
						size: "sm",
						onClick: () => setOpen(true),
						children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), " Добавить"]
					})]
				}), expenses.length === 0 ? /* @__PURE__ */ jsx("div", {
					className: "rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground",
					children: "За этот месяц ещё нет записей о расходах."
				}) : /* @__PURE__ */ jsx("div", {
					className: "space-y-2",
					children: expenses.map((e) => /* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border p-3",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ jsx("div", {
									className: "truncate text-sm font-medium",
									children: e.title
								}), /* @__PURE__ */ jsxs("div", {
									className: "truncate text-xs text-muted-foreground",
									children: [format(parseISO(e.spent_at), "d MMM yyyy", { locale: ru }), e.note ? ` · ${e.note}` : ""]
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "text-right text-sm font-semibold",
								children: fmt(Number(e.amount))
							}),
							/* @__PURE__ */ jsx(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => setPendingDelete(e),
								"aria-label": "Удалить",
								children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-red-600" })
							})
						]
					}, e.id))
				})]
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ jsxs(DialogContent, { children: [
					/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Новый расход" }) }),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Название" }), /* @__PURE__ */ jsx(Input, {
								value: form.title,
								onChange: (ev) => setForm((f) => ({
									...f,
									title: ev.target.value
								})),
								placeholder: "Аренда, коммуналка, запчасти…"
							})] }),
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Дата" }), /* @__PURE__ */ jsx(Input, {
									type: "date",
									value: form.spent_at,
									onChange: (ev) => setForm((f) => ({
										...f,
										spent_at: ev.target.value
									}))
								})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Сумма, ₽" }), /* @__PURE__ */ jsx(Input, {
									type: "number",
									inputMode: "numeric",
									value: form.amount,
									onChange: (ev) => setForm((f) => ({
										...f,
										amount: ev.target.value
									}))
								})] })]
							}),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Заметка" }), /* @__PURE__ */ jsx(Textarea, {
								value: form.note,
								onChange: (ev) => setForm((f) => ({
									...f,
									note: ev.target.value
								})),
								rows: 2
							})] })
						]
					}),
					/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						onClick: () => setOpen(false),
						children: "Отмена"
					}), /* @__PURE__ */ jsx(Button, {
						onClick: () => create.mutate(),
						disabled: !form.title.trim() || !form.amount || create.isPending,
						children: "Сохранить"
					})] })
				] })
			}),
			/* @__PURE__ */ jsx(AlertDialog, {
				open: pendingDelete !== null,
				onOpenChange: (v) => !v && setPendingDelete(null),
				children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [/* @__PURE__ */ jsxs(AlertDialogHeader, { children: [/* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить расход?" }), /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
					"«",
					pendingDelete?.title,
					"» на ",
					fmt(Number(pendingDelete?.amount ?? 0)),
					". Это действие нельзя отменить."
				] })] }), /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [/* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }), /* @__PURE__ */ jsx(AlertDialogAction, {
					onClick: () => pendingDelete && remove.mutate(pendingDelete.id),
					children: "Удалить"
				})] })] })
			})
		]
	});
}
function MechanicsBlock({ mechanics, appts, advances, fromIso, toIso, apptPayout }) {
	const byMech = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		appts.forEach((a) => {
			if (!a.mechanic_id) return;
			const entry = map.get(a.mechanic_id) ?? {
				payout: 0,
				rows: []
			};
			entry.payout += apptPayout(a);
			entry.rows.push(a);
			map.set(a.mechanic_id, entry);
		});
		return map;
	}, [appts, apptPayout]);
	const advByMech = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		advances.forEach((adv) => {
			const entry = map.get(adv.mechanic_id) ?? {
				total: 0,
				rows: []
			};
			entry.total += Number(adv.amount ?? 0);
			entry.rows.push(adv);
			map.set(adv.mechanic_id, entry);
		});
		return map;
	}, [advances]);
	const displayed = mechanics.filter((m) => (byMech.get(m.id)?.payout ?? 0) > 0 || (advByMech.get(m.id)?.total ?? 0) > 0);
	const list = displayed.length > 0 ? displayed : mechanics;
	return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
		className: "p-4 sm:p-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-4",
			children: [/* @__PURE__ */ jsx("h3", {
				className: "text-base font-semibold sm:text-lg",
				children: "ЗП мастеров за месяц"
			}), /* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground",
				children: "Начислено = сумма ставок мастера по выполненным работам. К выплате = начислено − авансы."
			})]
		}), list.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground",
			children: "Нет мастеров."
		}) : /* @__PURE__ */ jsx(Accordion, {
			type: "multiple",
			className: "space-y-2",
			children: list.map((m) => {
				const payout = byMech.get(m.id)?.payout ?? 0;
				const rows = byMech.get(m.id)?.rows ?? [];
				const advTotal = advByMech.get(m.id)?.total ?? 0;
				const advRows = advByMech.get(m.id)?.rows ?? [];
				const toPay = payout - advTotal;
				return /* @__PURE__ */ jsxs(AccordionItem, {
					value: m.id,
					className: "rounded-lg border px-3",
					children: [/* @__PURE__ */ jsx(AccordionTrigger, {
						className: "py-3 hover:no-underline",
						children: /* @__PURE__ */ jsxs("div", {
							className: "grid w-full grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 pr-2 text-left",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "truncate text-sm font-medium",
									children: m.full_name
								}),
								/* @__PURE__ */ jsxs(Badge, {
									variant: "secondary",
									children: ["Начислено ", fmt(payout)]
								}),
								/* @__PURE__ */ jsxs(Badge, {
									variant: "outline",
									children: ["Аванс ", fmt(advTotal)]
								}),
								/* @__PURE__ */ jsxs(Badge, {
									className: toPay >= 0 ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300",
									children: ["К выплате ", fmt(toPay)]
								})
							]
						})
					}), /* @__PURE__ */ jsx(AccordionContent, {
						className: "pb-4",
						children: /* @__PURE__ */ jsx(MechanicDetails, {
							mechanicId: m.id,
							rows,
							advances: advRows,
							fromIso,
							toIso
						})
					})]
				}, m.id);
			})
		})]
	}) });
}
function MechanicDetails({ mechanicId, rows, advances, fromIso, toIso }) {
	const qc = useQueryClient();
	const [advOpen, setAdvOpen] = useState(false);
	const [pendingDelete, setPendingDelete] = useState(null);
	const [form, setForm] = useState({
		paid_at: fromIso,
		amount: "",
		note: ""
	});
	const invalidate = () => qc.invalidateQueries({ queryKey: [
		"mechanic_advances",
		fromIso,
		toIso
	] });
	const create = useMutation({
		mutationFn: () => createMechanicAdvance({
			mechanic_id: mechanicId,
			paid_at: form.paid_at,
			amount: Number(form.amount) || 0,
			note: form.note.trim() || null
		}),
		onSuccess: () => {
			invalidate();
			setAdvOpen(false);
			setForm({
				paid_at: fromIso,
				amount: "",
				note: ""
			});
			toast.success("Аванс добавлен");
		},
		onError: (e) => toast.error(e.message)
	});
	const remove = useMutation({
		mutationFn: (id) => deleteMechanicAdvance(id),
		onSuccess: () => {
			invalidate();
			setPendingDelete(null);
			toast.success("Удалено");
		},
		onError: (e) => toast.error(e.message)
	});
	const serviceRows = rows.flatMap((a) => (a.services ?? []).map((s) => ({
		appt_id: a.id,
		starts_at: a.starts_at,
		client: a.car?.client?.full_name ?? "—",
		car: `${a.car?.brand?.name ?? ""} ${a.car?.model ?? ""}`.trim(),
		service_name: s.service?.name ?? "—",
		price: Number(s.price ?? 0),
		payout: Number(s.mechanic_payout ?? 0)
	}))).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
	return /* @__PURE__ */ jsxs("div", {
		className: "grid gap-4 md:grid-cols-2",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				className: "mb-2 text-sm font-semibold",
				children: "Работы за месяц"
			}), serviceRows.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded border border-dashed py-6 text-center text-xs text-muted-foreground",
				children: "Нет выполненных работ."
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-1",
				children: serviceRows.map((r, i) => /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2 text-xs",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ jsx("div", {
							className: "truncate font-medium",
							children: r.service_name
						}), /* @__PURE__ */ jsxs("div", {
							className: "truncate text-muted-foreground",
							children: [
								format(parseISO(r.starts_at), "d MMM", { locale: ru }),
								" · ",
								r.client,
								r.car ? ` · ${r.car}` : ""
							]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "text-right",
						children: [/* @__PURE__ */ jsx("div", {
							className: "font-semibold text-emerald-700",
							children: fmt(r.payout)
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-muted-foreground",
							children: ["из ", fmt(r.price)]
						})]
					})]
				}, `${r.appt_id}-${i}`))
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm font-semibold",
					children: "Авансы"
				}), /* @__PURE__ */ jsxs(Button, {
					size: "sm",
					variant: "outline",
					onClick: () => setAdvOpen(true),
					children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-3 w-3" }), " Аванс"]
				})]
			}), advances.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded border border-dashed py-6 text-center text-xs text-muted-foreground",
				children: "Авансов ещё не было."
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-1",
				children: advances.map((a) => /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded border p-2 text-xs",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsx("div", {
								className: "truncate font-medium",
								children: format(parseISO(a.paid_at), "d MMM yyyy", { locale: ru })
							}), a.note ? /* @__PURE__ */ jsx("div", {
								className: "truncate text-muted-foreground",
								children: a.note
							}) : null]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "text-right font-semibold",
							children: fmt(Number(a.amount))
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => setPendingDelete(a),
							"aria-label": "Удалить",
							children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5 text-red-600" })
						})
					]
				}, a.id))
			})] }),
			/* @__PURE__ */ jsx(Dialog, {
				open: advOpen,
				onOpenChange: setAdvOpen,
				children: /* @__PURE__ */ jsxs(DialogContent, { children: [
					/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Новый аванс" }) }),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Дата" }), /* @__PURE__ */ jsx(Input, {
								type: "date",
								value: form.paid_at,
								onChange: (ev) => setForm((f) => ({
									...f,
									paid_at: ev.target.value
								}))
							})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Сумма, ₽" }), /* @__PURE__ */ jsx(Input, {
								type: "number",
								inputMode: "numeric",
								value: form.amount,
								onChange: (ev) => setForm((f) => ({
									...f,
									amount: ev.target.value
								}))
							})] })]
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Заметка" }), /* @__PURE__ */ jsx(Input, {
							value: form.note,
							onChange: (ev) => setForm((f) => ({
								...f,
								note: ev.target.value
							}))
						})] })]
					}),
					/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						onClick: () => setAdvOpen(false),
						children: "Отмена"
					}), /* @__PURE__ */ jsx(Button, {
						onClick: () => create.mutate(),
						disabled: !form.amount || create.isPending,
						children: "Сохранить"
					})] })
				] })
			}),
			/* @__PURE__ */ jsx(AlertDialog, {
				open: pendingDelete !== null,
				onOpenChange: (v) => !v && setPendingDelete(null),
				children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [/* @__PURE__ */ jsxs(AlertDialogHeader, { children: [/* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить аванс?" }), /* @__PURE__ */ jsx(AlertDialogDescription, { children: pendingDelete ? `${format(parseISO(pendingDelete.paid_at), "d MMM yyyy", { locale: ru })} — ${fmt(Number(pendingDelete.amount))}` : "" })] }), /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [/* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }), /* @__PURE__ */ jsx(AlertDialogAction, {
					onClick: () => pendingDelete && remove.mutate(pendingDelete.id),
					children: "Удалить"
				})] })] })
			})
		]
	});
}
function ServicesBlock({ appts, effPayout }) {
	const rows = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		appts.forEach((a) => {
			(a.services ?? []).forEach((s) => {
				const key = s.service_id;
				const cur = map.get(key) ?? {
					name: s.service?.name ?? "—",
					count: 0,
					revenue: 0,
					payout: 0
				};
				cur.count += 1;
				cur.revenue += Number(s.price ?? 0);
				cur.payout += effPayout(a.mechanic_id, Number(s.price ?? 0), Number(s.mechanic_payout ?? 0));
				map.set(key, cur);
			});
		});
		return [...map.values()].sort((a, b) => b.revenue - a.revenue);
	}, [appts, effPayout]);
	return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
		className: "p-4 sm:p-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-4",
			children: [/* @__PURE__ */ jsx("h3", {
				className: "text-base font-semibold sm:text-lg",
				children: "По услугам"
			}), /* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground",
				children: "Топ услуг за месяц: количество, выручка, ЗП мастерам, маржа"
			})]
		}), rows.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground",
			children: "Нет выполненных работ за месяц."
		}) : /* @__PURE__ */ jsxs("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-[minmax(0,1fr)_60px_110px_110px_110px] gap-2 border-b pb-1 text-xs font-semibold text-muted-foreground",
				children: [
					/* @__PURE__ */ jsx("div", { children: "Услуга" }),
					/* @__PURE__ */ jsx("div", {
						className: "text-right",
						children: "Кол-во"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-right",
						children: "Выручка"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-right",
						children: "ЗП мастеру"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-right",
						children: "Маржа"
					})
				]
			}), rows.map((r) => /* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-[minmax(0,1fr)_60px_110px_110px_110px] items-center gap-2 rounded border p-2 text-sm",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "truncate",
						children: r.name
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-right",
						children: r.count
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-right font-medium",
						children: fmt(r.revenue)
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-right text-amber-700",
						children: fmt(r.payout)
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-right font-semibold text-emerald-700",
						children: fmt(r.revenue - r.payout)
					})
				]
			}, r.name))]
		})]
	}) });
}
//#endregion
export { ExpensesPage as component };
