import { $ as listServices, C as deleteExpense, I as listAppointments, J as listMechanics, T as deleteMechanicAdvance, U as listExpenses, W as listMechanicAdvances, Y as listPaymentsRange, f as createMechanicAdvance, u as createExpense } from "./api-DUIXY4t-.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-D9xGQQQw.js";
import { n as CardContent, t as Card } from "./card-BXjpJ96D.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { t as Textarea } from "./textarea-kko37XEX.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { t as Badge } from "./badge-D1Dupn2y.js";
import { n as effectivePercent, t as effectivePayout } from "./payouts-B59W4X07.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.js";
import * as React from "react";
import { Fragment, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addDays, addMonths, addWeeks, endOfDay, endOfMonth, endOfWeek, format, isSameDay, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as XLSX from "xlsx";
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
//#region src/components/ExpensesMonthlyTable.tsx
var fmt$2 = (n) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";
var UNASSIGNED = "__unassigned__";
function ExpensesMonthlyTable({ month, appts, mechanics, advances, mechById, svcById }) {
	const [mechFilter, setMechFilter] = useState("all");
	const allMechColumns = useMemo(() => {
		const list = mechanics.map((m) => ({
			id: m.id,
			name: m.full_name
		}));
		if (appts.some((a) => a.status === "done" && !a.mechanic_id && (a.services ?? []).length > 0) || advances.some((a) => !a.mechanic_id)) list.push({
			id: UNASSIGNED,
			name: "Без мастера"
		});
		return list;
	}, [
		mechanics,
		appts,
		advances
	]);
	const visibleMechs = useMemo(() => mechFilter === "all" ? allMechColumns : allMechColumns.filter((m) => m.id === mechFilter), [allMechColumns, mechFilter]);
	const rows = useMemo(() => {
		const advByMechDay = /* @__PURE__ */ new Map();
		advances.forEach((a) => {
			const key = `${a.mechanic_id ?? UNASSIGNED}|${a.paid_at.slice(0, 10)}`;
			advByMechDay.set(key, (advByMechDay.get(key) ?? 0) + Number(a.amount ?? 0));
		});
		const usedAdvance = /* @__PURE__ */ new Set();
		const out = [];
		const sortedAppts = [...appts].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
		for (const a of sortedAppts) {
			if (a.status !== "done") continue;
			const dateOnly = a.starts_at.slice(0, 10);
			const carName = [a.car?.brand?.name, a.car?.model].filter(Boolean).join(" ") || "—";
			const plate = a.car?.license_plate ?? "";
			const mechanicId = a.mechanic_id ?? UNASSIGNED;
			const services = a.services ?? [];
			if (services.length === 0) continue;
			services.forEach((s, idx) => {
				const price = Number(s.price ?? 0);
				const stored = Number(s.mechanic_payout ?? 0);
				const mech = a.mechanic_id ? mechById.get(a.mechanic_id) ?? null : null;
				const svc = s.service_id ? svcById.get(s.service_id) ?? null : null;
				const percent = effectivePercent(mech, svc);
				const payout = effectivePayout({
					storedPayout: stored,
					price,
					mechanic: mech,
					service: svc
				});
				let advance = 0;
				if (idx === 0) {
					const key = `${mechanicId}|${dateOnly}`;
					if (!usedAdvance.has(key)) {
						advance = advByMechDay.get(key) ?? 0;
						if (advance > 0) usedAdvance.add(key);
					}
				}
				out.push({
					date: dateOnly,
					dateLabel: format(parseISO(dateOnly), "dd.MM"),
					car: carName,
					plate,
					work: s.service?.name ?? "Услуга",
					byMech: { [mechanicId]: {
						percent,
						price,
						payout,
						advance
					} }
				});
			});
		}
		advByMechDay.forEach((amount, key) => {
			if (usedAdvance.has(key) || amount <= 0) return;
			const [mechanicId, dateOnly] = key.split("|");
			out.push({
				date: dateOnly,
				dateLabel: format(parseISO(dateOnly), "dd.MM"),
				car: "—",
				plate: "",
				work: "Аванс",
				byMech: { [mechanicId]: {
					percent: 0,
					price: 0,
					payout: 0,
					advance: amount
				} }
			});
		});
		out.sort((a, b) => a.date.localeCompare(b.date));
		return out;
	}, [
		appts,
		advances,
		mechById,
		svcById
	]);
	const filteredRows = useMemo(() => {
		if (mechFilter === "all") return rows;
		return rows.filter((r) => {
			const c = r.byMech[mechFilter];
			return c && (c.price > 0 || c.payout > 0 || c.advance > 0);
		});
	}, [rows, mechFilter]);
	const totalsByMech = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		visibleMechs.forEach((m) => map.set(m.id, {
			percent: 0,
			price: 0,
			payout: 0,
			advance: 0
		}));
		filteredRows.forEach((r) => {
			visibleMechs.forEach((m) => {
				const c = r.byMech[m.id];
				if (!c) return;
				const t = map.get(m.id);
				t.price += c.price;
				t.payout += c.payout;
				t.advance += c.advance;
			});
		});
		return map;
	}, [filteredRows, visibleMechs]);
	const grandTotals = useMemo(() => {
		const acc = {
			price: 0,
			payout: 0,
			advance: 0
		};
		totalsByMech.forEach((t) => {
			acc.price += t.price;
			acc.payout += t.payout;
			acc.advance += t.advance;
		});
		return acc;
	}, [totalsByMech]);
	const monthLabel = format(month, "LLLL yyyy", { locale: ru });
	const handlePrint = () => window.print();
	const handleExcel = () => {
		const topRow = [
			"Число",
			"Марка / машина",
			"Гос. №",
			"Работа"
		];
		visibleMechs.forEach((m) => topRow.push(m.name, "", "", ""));
		const subRow = [
			"",
			"",
			"",
			""
		];
		visibleMechs.forEach(() => subRow.push("%", "Сумма", "ЗП", "Аванс"));
		const dataRows = filteredRows.map((r) => {
			const row = [
				r.dateLabel,
				r.car,
				r.plate,
				r.work
			];
			visibleMechs.forEach((m) => {
				const c = r.byMech[m.id];
				if (!c) {
					row.push("", "", "", "");
					return;
				}
				row.push(c.percent ? `${c.percent}%` : "", c.price || "", c.payout || "", c.advance || "");
			});
			return row;
		});
		const totalsRow = [
			"",
			"",
			"",
			"ИТОГО"
		];
		visibleMechs.forEach((m) => {
			const t = totalsByMech.get(m.id);
			totalsRow.push("", t.price || "", t.payout || "", t.advance || "");
		});
		const grandRow = [
			"",
			"",
			"",
			"ВСЕГО",
			...Array(visibleMechs.length * 4 - 3).fill(""),
			`Сумма: ${grandTotals.price} · ЗП: ${grandTotals.payout} · Аванс: ${grandTotals.advance}`
		];
		const ws = XLSX.utils.aoa_to_sheet([
			topRow,
			subRow,
			...dataRows,
			totalsRow,
			grandRow
		]);
		ws["!merges"] = ws["!merges"] ?? [];
		visibleMechs.forEach((_, idx) => {
			const start = 4 + idx * 4;
			ws["!merges"].push({
				s: {
					r: 0,
					c: start
				},
				e: {
					r: 0,
					c: start + 3
				}
			});
		});
		ws["!cols"] = [
			{ wch: 8 },
			{ wch: 22 },
			{ wch: 14 },
			{ wch: 30 },
			...visibleMechs.flatMap(() => [
				{ wch: 6 },
				{ wch: 12 },
				{ wch: 12 },
				{ wch: 10 }
			])
		];
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Свод");
		const safeMonth = format(month, "yyyy-MM");
		XLSX.writeFile(wb, `Свод_${safeMonth}.xlsx`);
	};
	return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
		className: "p-4 sm:p-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "no-print mb-4 flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ jsxs("h3", {
					className: "text-base font-semibold sm:text-lg",
					children: ["Сводная за ", monthLabel]
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted-foreground",
					children: "Колонка на каждого мастера — работы, ЗП и авансы"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ jsxs("select", {
						value: mechFilter,
						onChange: (e) => setMechFilter(e.target.value),
						className: "h-9 rounded-md border bg-background px-3 text-sm",
						children: [/* @__PURE__ */ jsx("option", {
							value: "all",
							children: "Все мастера"
						}), allMechColumns.map((m) => /* @__PURE__ */ jsx("option", {
							value: m.id,
							children: m.name
						}, m.id))]
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						size: "sm",
						onClick: handleExcel,
						children: [/* @__PURE__ */ jsx(FileSpreadsheet, { className: "mr-1.5 h-4 w-4" }), "Excel"]
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						size: "sm",
						onClick: handlePrint,
						children: [/* @__PURE__ */ jsx(Printer, { className: "mr-1.5 h-4 w-4" }), "Печать"]
					})
				]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "print-area",
			children: [/* @__PURE__ */ jsx("div", {
				className: "print-only mb-3",
				children: /* @__PURE__ */ jsxs("div", {
					className: "text-lg font-bold",
					children: ["Сводная за ", monthLabel]
				})
			}), filteredRows.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground",
				children: "За выбранный месяц данных нет."
			}) : /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "expense-table w-full border-collapse text-sm",
					children: [
						/* @__PURE__ */ jsxs("thead", { children: [/* @__PURE__ */ jsxs("tr", {
							className: "border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground",
							children: [
								/* @__PURE__ */ jsx("th", {
									rowSpan: 2,
									className: "px-2 py-2 text-left align-bottom",
									children: "Число"
								}),
								/* @__PURE__ */ jsx("th", {
									rowSpan: 2,
									className: "px-2 py-2 text-left align-bottom",
									children: "Марка / машина"
								}),
								/* @__PURE__ */ jsx("th", {
									rowSpan: 2,
									className: "px-2 py-2 text-left align-bottom",
									children: "Гос. №"
								}),
								/* @__PURE__ */ jsx("th", {
									rowSpan: 2,
									className: "px-2 py-2 text-left align-bottom",
									children: "Работа"
								}),
								visibleMechs.map((m) => /* @__PURE__ */ jsx("th", {
									colSpan: 4,
									className: "border-l px-2 py-2 text-center font-semibold text-foreground",
									children: m.name
								}, m.id))
							]
						}), /* @__PURE__ */ jsx("tr", {
							className: "border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground",
							children: visibleMechs.map((m) => /* @__PURE__ */ jsxs(Fragment, { children: [
								/* @__PURE__ */ jsx("th", {
									className: "border-l px-2 py-1.5 text-right",
									children: "%"
								}, `${m.id}-p`),
								/* @__PURE__ */ jsx("th", {
									className: "px-2 py-1.5 text-right",
									children: "Сумма"
								}, `${m.id}-s`),
								/* @__PURE__ */ jsx("th", {
									className: "px-2 py-1.5 text-right",
									children: "ЗП"
								}, `${m.id}-z`),
								/* @__PURE__ */ jsx("th", {
									className: "px-2 py-1.5 text-right",
									children: "Аванс"
								}, `${m.id}-a`)
							] }, m.id))
						})] }),
						/* @__PURE__ */ jsx("tbody", { children: filteredRows.map((r, i) => /* @__PURE__ */ jsxs("tr", {
							className: "border-b last:border-0 hover:bg-muted/30",
							children: [
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap px-2 py-2 tabular-nums",
									children: r.dateLabel
								}),
								/* @__PURE__ */ jsx("td", {
									className: "px-2 py-2",
									children: r.car
								}),
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap px-2 py-2 text-muted-foreground",
									children: r.plate
								}),
								/* @__PURE__ */ jsx("td", {
									className: "px-2 py-2",
									children: r.work
								}),
								visibleMechs.map((m) => {
									const c = r.byMech[m.id];
									if (!c) return /* @__PURE__ */ jsxs(Fragment, { children: [
										/* @__PURE__ */ jsx("td", {
											className: "border-l px-2 py-2 text-right text-muted-foreground",
											children: "—"
										}, `${m.id}-p`),
										/* @__PURE__ */ jsx("td", {
											className: "px-2 py-2 text-right text-muted-foreground",
											children: "—"
										}, `${m.id}-s`),
										/* @__PURE__ */ jsx("td", {
											className: "px-2 py-2 text-right text-muted-foreground",
											children: "—"
										}, `${m.id}-z`),
										/* @__PURE__ */ jsx("td", {
											className: "px-2 py-2 text-right text-muted-foreground",
											children: "—"
										}, `${m.id}-a`)
									] }, m.id);
									return /* @__PURE__ */ jsxs(Fragment, { children: [
										/* @__PURE__ */ jsx("td", {
											className: "whitespace-nowrap border-l px-2 py-2 text-right tabular-nums",
											children: c.percent ? `${c.percent}%` : ""
										}, `${m.id}-p`),
										/* @__PURE__ */ jsx("td", {
											className: "whitespace-nowrap px-2 py-2 text-right tabular-nums",
											children: c.price ? fmt$2(c.price) : ""
										}, `${m.id}-s`),
										/* @__PURE__ */ jsx("td", {
											className: "whitespace-nowrap px-2 py-2 text-right tabular-nums text-amber-700",
											children: c.payout ? fmt$2(c.payout) : ""
										}, `${m.id}-z`),
										/* @__PURE__ */ jsx("td", {
											className: "whitespace-nowrap px-2 py-2 text-right tabular-nums text-red-600",
											children: c.advance ? fmt$2(c.advance) : ""
										}, `${m.id}-a`)
									] }, m.id);
								})
							]
						}, i)) }),
						/* @__PURE__ */ jsxs("tfoot", { children: [/* @__PURE__ */ jsxs("tr", {
							className: "border-t-2 bg-muted/40 font-semibold",
							children: [/* @__PURE__ */ jsx("td", {
								className: "px-2 py-2",
								colSpan: 4,
								children: "ИТОГО"
							}), visibleMechs.map((m) => {
								const t = totalsByMech.get(m.id);
								return /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("td", { className: "border-l px-2 py-2 text-right" }, `${m.id}-tp`),
									/* @__PURE__ */ jsx("td", {
										className: "whitespace-nowrap px-2 py-2 text-right tabular-nums",
										children: fmt$2(t.price)
									}, `${m.id}-ts`),
									/* @__PURE__ */ jsx("td", {
										className: "whitespace-nowrap px-2 py-2 text-right tabular-nums text-amber-700",
										children: fmt$2(t.payout)
									}, `${m.id}-tz`),
									/* @__PURE__ */ jsx("td", {
										className: "whitespace-nowrap px-2 py-2 text-right tabular-nums text-red-600",
										children: fmt$2(t.advance)
									}, `${m.id}-ta`)
								] }, m.id);
							})]
						}), /* @__PURE__ */ jsx("tr", {
							className: "border-t bg-muted/20 text-xs",
							children: /* @__PURE__ */ jsxs("td", {
								className: "px-2 py-2 font-semibold",
								colSpan: 4 + visibleMechs.length * 4,
								children: [
									"ВСЕГО по всем мастерам: Сумма",
									" ",
									/* @__PURE__ */ jsx("span", {
										className: "font-bold",
										children: fmt$2(grandTotals.price)
									}),
									" · ЗП",
									" ",
									/* @__PURE__ */ jsx("span", {
										className: "font-bold text-amber-700",
										children: fmt$2(grandTotals.payout)
									}),
									" · Аванс",
									" ",
									/* @__PURE__ */ jsx("span", {
										className: "font-bold text-red-600",
										children: fmt$2(grandTotals.advance)
									})
								]
							})
						})] })
					]
				})
			})]
		})]
	}) });
}
//#endregion
//#region src/components/ExpensesDrillDown.tsx
var fmt$1 = (n) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";
var fmtDate = (iso) => format(parseISO(iso.length > 10 ? iso : iso + "T00:00:00"), "d MMM yyyy", { locale: ru });
var TITLE = {
	profit: "Чистая прибыль",
	income: "Доходы (касса)",
	payout: "Зарплаты мастеров",
	expense: "Прочие расходы"
};
function ExpensesDrillDown(props) {
	const { metric, onClose } = props;
	return /* @__PURE__ */ jsx(Dialog, {
		open: metric !== null,
		onOpenChange: (v) => !v && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-h-[92vh] w-[95vw] max-w-3xl overflow-y-auto p-0",
			children: [/* @__PURE__ */ jsxs(DialogHeader, {
				className: "border-b p-4 sm:p-6",
				children: [/* @__PURE__ */ jsx(DialogTitle, {
					className: "text-lg",
					children: metric ? TITLE[metric] : ""
				}), /* @__PURE__ */ jsxs("div", {
					className: "text-xs text-muted-foreground",
					children: [
						"За ",
						props.periodLabel,
						" · ",
						props.rangeLabel
					]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "p-4 sm:p-6",
				children: [
					metric === "profit" && /* @__PURE__ */ jsx(ProfitView, { ...props }),
					metric === "income" && /* @__PURE__ */ jsx(IncomeView, { ...props }),
					metric === "payout" && /* @__PURE__ */ jsx(PayoutView, { ...props }),
					metric === "expense" && /* @__PURE__ */ jsx(ExpenseView, { ...props })
				]
			})]
		})
	});
}
function Row({ label, value, tone, onClick, strong }) {
	const toneCls = tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-foreground";
	const base = "flex items-center justify-between gap-3 rounded-lg border p-3 text-sm";
	return /* @__PURE__ */ jsxs("div", {
		className: onClick ? `${base} cursor-pointer transition-colors hover:bg-muted/60` : base,
		onClick,
		role: onClick ? "button" : void 0,
		children: [/* @__PURE__ */ jsx("span", {
			className: strong ? "font-semibold" : "",
			children: label
		}), /* @__PURE__ */ jsx("span", {
			className: `tabular-nums ${strong ? "font-bold" : "font-semibold"} ${toneCls}`,
			children: value
		})]
	});
}
function ProfitView(p) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "rounded-lg border-2 border-green-500/30 bg-green-50 p-4 dark:bg-green-950/20",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
						children: ["Чистая прибыль за ", p.periodLabel]
					}),
					/* @__PURE__ */ jsx("div", {
						className: `mt-1 text-3xl font-bold tabular-nums ${p.cashProfit >= 0 ? "text-green-600" : "text-red-600"}`,
						children: fmt$1(p.cashProfit)
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 rounded-md bg-background p-3 font-mono text-xs leading-6",
						children: [
							"Прибыль = Касса − ЗП мастеров − Прочие расходы",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("span", {
								className: p.cashProfit >= 0 ? "text-green-600" : "text-red-600",
								children: fmt$1(p.cashProfit)
							}),
							" ",
							"= ",
							fmt$1(p.revenue),
							" − ",
							fmt$1(p.mechanicsAccrued),
							" − ",
							fmt$1(p.otherExpenses)
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ jsx(Row, {
						label: "Касса (платежи клиентов)",
						value: "+ " + fmt$1(p.revenue),
						tone: "good",
						onClick: () => p.onOpenMetric("income")
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "Начислено мастерам",
						value: "− " + fmt$1(p.mechanicsAccrued),
						tone: "warn",
						onClick: () => p.onOpenMetric("payout")
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "Прочие расходы",
						value: "− " + fmt$1(p.otherExpenses),
						tone: "warn",
						onClick: () => p.onOpenMetric("expense")
					})
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground",
				children: "Учитываем кассовые поступления в этот период. Начисленная ЗП считается по услугам в выполненных за период записях. Нажмите на строку — раскроется расшифровка."
			})
		]
	});
}
function IncomeView(p) {
	const apptMap = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		p.appts.forEach((a) => m.set(a.id, a));
		return m;
	}, [p.appts]);
	const paymentsSorted = useMemo(() => [...p.payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at)), [p.payments]);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
					children: "Всего поступило"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-1 text-3xl font-bold tabular-nums",
					children: fmt$1(p.revenue)
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						p.payments.length,
						" платеж",
						p.payments.length === 1 ? "" : p.payments.length < 5 ? "а" : "ей",
						" ",
						"по дате оплаты"
					]
				})
			] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				className: "mb-2 text-sm font-semibold",
				children: "Список платежей"
			}), paymentsSorted.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded border border-dashed py-8 text-center text-sm text-muted-foreground",
				children: "Платежей за период не было."
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-1.5",
				children: paymentsSorted.map((pay) => {
					const a = apptMap.get(pay.appointment_id);
					const client = a?.car?.client?.full_name ?? "—";
					const car = a ? `${a.car?.brand?.name ?? ""} ${a.car?.model ?? ""}`.trim() : "";
					const plate = a?.car?.license_plate ?? "";
					const services = (a?.services ?? []).map((s) => s.service?.name).filter(Boolean);
					return /* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2.5 text-xs",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "truncate font-medium",
									children: [
										client,
										car ? ` · ${car}` : "",
										plate ? ` · ${plate}` : ""
									]
								}),
								services.length > 0 && /* @__PURE__ */ jsx("div", {
									className: "truncate text-foreground/80",
									children: services.join(", ")
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "truncate text-muted-foreground",
									children: [
										fmtDate(pay.paid_at),
										pay.method ? ` · ${pay.method}` : "",
										pay.note ? ` · ${pay.note}` : ""
									]
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-right font-semibold text-green-700 tabular-nums",
							children: ["+ ", fmt$1(Number(pay.amount))]
						})]
					}, pay.id);
				})
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				className: "mb-2 text-sm font-semibold",
				children: "Ожидается: неоплаченные записи"
			}), p.upcomingAppts.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded border border-dashed py-6 text-center text-xs text-muted-foreground",
				children: "Все предстоящие записи оплачены."
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-1.5",
				children: p.upcomingAppts.map((a) => {
					const debt = Math.max(0, (a.total_price ?? 0) - Number(a.paid_amount ?? 0));
					if (debt <= 0) return null;
					return /* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2.5 text-xs",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "truncate font-medium",
								children: [
									a.car?.client?.full_name ?? "—",
									" ·",
									" ",
									a.car?.brand?.name ?? "",
									" ",
									a.car?.model ?? ""
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "truncate text-muted-foreground",
								children: [
									format(parseISO(a.starts_at), "d MMM, HH:mm", { locale: ru }),
									" ",
									"· оплачено ",
									fmt$1(Number(a.paid_amount ?? 0)),
									" из",
									" ",
									fmt$1(a.total_price ?? 0)
								]
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "text-right font-semibold text-amber-600 tabular-nums",
							children: fmt$1(debt)
						})]
					}, a.id);
				})
			})] })
		]
	});
}
function PayoutView(p) {
	const mechName = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		p.mechanics.forEach((x) => m.set(x.id, x.full_name));
		return m;
	}, [p.mechanics]);
	const groups = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		const keyOf = (id) => id ?? "__none";
		p.doneAppts.forEach((a) => {
			const mid = a.mechanic_id ?? null;
			const g = map.get(keyOf(mid)) ?? {
				mechId: mid,
				name: mid ? mechName.get(mid) ?? "Мастер" : "Без мастера",
				lines: [],
				total: 0,
				advances: 0
			};
			const mech = mid ? p.mechById.get(mid) ?? null : null;
			(a.services ?? []).forEach((s) => {
				const price = Number(s.price ?? 0);
				const stored = Number(s.mechanic_payout ?? 0);
				const svc = s.service_id ? p.svcById.get(s.service_id) ?? null : null;
				const percent = effectivePercent(mech, svc);
				const payout = effectivePayout({
					storedPayout: stored,
					price,
					mechanic: mech,
					service: svc
				});
				g.lines.push({
					apptId: a.id,
					starts_at: a.starts_at,
					client: a.car?.client?.full_name ?? "—",
					car: `${a.car?.brand?.name ?? ""} ${a.car?.model ?? ""}`.trim(),
					service: s.service?.name ?? "Услуга",
					price,
					percent,
					payout,
					stored
				});
				g.total += payout;
			});
			map.set(keyOf(mid), g);
		});
		p.advances.forEach((adv) => {
			const g = map.get(adv.mechanic_id);
			if (g) g.advances += Number(adv.amount ?? 0);
		});
		return Array.from(map.values()).sort((a, b) => b.total - a.total);
	}, [
		p.doneAppts,
		p.advances,
		p.mechById,
		p.svcById,
		mechName
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-5",
		children: [/* @__PURE__ */ jsxs("div", { children: [
			/* @__PURE__ */ jsx("div", {
				className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
				children: "Начислено мастерам"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-1 text-3xl font-bold text-amber-600 tabular-nums",
				children: fmt$1(p.mechanicsAccrued)
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-2 rounded-md border bg-muted/30 p-3 text-xs leading-6",
				children: [
					"Формула по услуге: ставка мастера, если задана; иначе % услуги; иначе 50%. Если в услуге вручную указана сумма выплаты — берётся она.",
					/* @__PURE__ */ jsx("br", {}),
					/* @__PURE__ */ jsx("span", {
						className: "font-mono",
						children: "ЗП = цена × % ÷ 100"
					})
				]
			})
		] }), groups.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "rounded border border-dashed py-8 text-center text-sm text-muted-foreground",
			children: "В этом периоде нет выполненных работ."
		}) : /* @__PURE__ */ jsx("div", {
			className: "space-y-4",
			children: groups.map((g) => {
				const toPay = g.total - g.advances;
				return /* @__PURE__ */ jsxs("div", {
					className: "rounded-lg border",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 p-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "font-semibold",
							children: g.name
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ jsxs(Badge, {
									variant: "secondary",
									children: ["Начислено ", fmt$1(g.total)]
								}),
								/* @__PURE__ */ jsxs(Badge, {
									variant: "outline",
									children: ["Аванс ", fmt$1(g.advances)]
								}),
								/* @__PURE__ */ jsxs(Badge, {
									className: toPay >= 0 ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300",
									children: ["К выплате ", fmt$1(toPay)]
								})
							]
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "divide-y",
						children: g.lines.sort((a, b) => b.starts_at.localeCompare(a.starts_at)).map((l, i) => /* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-2.5 text-xs",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ jsx("div", {
									className: "truncate font-medium",
									children: l.service
								}), /* @__PURE__ */ jsxs("div", {
									className: "truncate text-muted-foreground",
									children: [
										format(parseISO(l.starts_at), "d MMM", { locale: ru }),
										" ",
										"· ",
										l.client,
										l.car ? ` · ${l.car}` : ""
									]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "text-right tabular-nums",
								children: [/* @__PURE__ */ jsx("div", {
									className: "font-semibold text-emerald-700",
									children: fmt$1(l.payout)
								}), /* @__PURE__ */ jsxs("div", {
									className: "text-muted-foreground",
									children: [
										fmt$1(l.price),
										" × ",
										l.percent,
										"%",
										l.stored > 0 ? " (руч.)" : ""
									]
								})]
							})]
						}, `${l.apptId}-${i}`))
					})]
				}, g.mechId ?? "none");
			})
		})]
	});
}
function ExpenseView(p) {
	const list = useMemo(() => [...p.expenses].sort((a, b) => b.spent_at.localeCompare(a.spent_at)), [p.expenses]);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
					children: "Итого прочих расходов"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-1 text-3xl font-bold text-amber-600 tabular-nums",
					children: fmt$1(p.otherExpenses)
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						list.length,
						" запис",
						list.length === 1 ? "ь" : list.length < 5 ? "и" : "ей"
					]
				})
			] }),
			list.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "rounded border border-dashed py-8 text-center text-sm text-muted-foreground",
				children: "Расходов в этом периоде не было."
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-1.5",
				children: list.map((e) => /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded border p-2.5 text-xs",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ jsx("div", {
							className: "truncate font-medium",
							children: e.title
						}), /* @__PURE__ */ jsxs("div", {
							className: "truncate text-muted-foreground",
							children: [fmtDate(e.spent_at), e.note ? ` · ${e.note}` : ""]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "text-right font-semibold text-amber-700 tabular-nums",
						children: ["− ", fmt$1(Number(e.amount))]
					})]
				}, e.id))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "pt-2",
				children: /* @__PURE__ */ jsx(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => {
						p.onClose();
						setTimeout(() => {
							document.getElementById("expenses-block")?.scrollIntoView({
								behavior: "smooth",
								block: "start"
							});
						}, 100);
					},
					children: "Добавить или удалить расход"
				})
			})
		]
	});
}
//#endregion
//#region src/routes/expenses.tsx?tsr-split=component
var fmt = (n) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₽";
var isoDate = (d) => format(d, "yyyy-MM-dd");
function ExpensesPage() {
	const [period, setPeriod] = useState("month");
	const [anchor, setAnchor] = useState(() => /* @__PURE__ */ new Date());
	const [drill, setDrill] = useState(null);
	const { rangeStart, rangeEnd } = useMemo(() => {
		if (period === "day") return {
			rangeStart: startOfDay(anchor),
			rangeEnd: endOfDay(anchor)
		};
		if (period === "week") return {
			rangeStart: startOfWeek(anchor, { weekStartsOn: 1 }),
			rangeEnd: endOfWeek(anchor, { weekStartsOn: 1 })
		};
		return {
			rangeStart: startOfMonth(anchor),
			rangeEnd: endOfMonth(anchor)
		};
	}, [anchor, period]);
	const fromIso = isoDate(rangeStart);
	const toIso = isoDate(rangeEnd);
	const periodLabel = period === "day" ? "день" : period === "week" ? "неделю" : "месяц";
	const rangeLabel = (() => {
		if (period === "day") return format(rangeStart, "d MMMM yyyy", { locale: ru });
		if (period === "week") return `${format(rangeStart, "d MMM", { locale: ru })} – ${format(rangeEnd, "d MMM yyyy", { locale: ru })}`;
		return format(rangeStart, "LLLL yyyy", { locale: ru });
	})();
	const { data: appts = [] } = useQuery({
		queryKey: [
			"appointments",
			"expenses-range",
			fromIso,
			toIso
		],
		queryFn: () => listAppointments(rangeStart, rangeEnd)
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
				className: "mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "truncate text-xl font-bold sm:text-2xl",
						children: "Расходы"
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-0.5 truncate text-xs text-muted-foreground sm:text-sm",
						children: ["Оборот, прибыль, ЗП мастеров и авансы за ", periodLabel]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "shrink-0",
					children: /* @__PURE__ */ jsx(RangePicker, {
						period,
						setPeriod,
						anchor,
						setAnchor
					})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(Card, {
						role: "button",
						onClick: () => setDrill("profit"),
						className: `cursor-pointer border-2 transition-shadow hover:shadow-md ${cashProfit >= 0 ? "border-green-500/30" : "border-red-500/30"} sm:col-span-2 lg:col-span-1`,
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
					/* @__PURE__ */ jsx(Card, {
						role: "button",
						onClick: () => setDrill("income"),
						className: "cursor-pointer transition-shadow hover:shadow-md",
						children: /* @__PURE__ */ jsxs(CardContent, {
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
								/* @__PURE__ */ jsxs("div", {
									className: "mt-1 text-[11px] text-muted-foreground",
									children: [
										"Оборот кассы (платежи за ",
										periodLabel,
										")"
									]
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
											/* @__PURE__ */ jsxs("div", {
												className: "truncate text-[10px] text-muted-foreground",
												children: ["по работам за ", periodLabel]
											})
										]
									})]
								})
							]
						})
					}),
					/* @__PURE__ */ jsx(Card, {
						role: "button",
						onClick: () => setDrill("payout"),
						className: "cursor-pointer transition-shadow hover:shadow-md",
						children: /* @__PURE__ */ jsxs(CardContent, {
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
						})
					}),
					/* @__PURE__ */ jsx(Card, {
						role: "button",
						onClick: () => setDrill("expense"),
						className: "cursor-pointer transition-shadow hover:shadow-md",
						children: /* @__PURE__ */ jsxs(CardContent, {
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
										onClick: (ev) => {
											ev.stopPropagation();
											setDrill("expense");
										},
										className: "inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-amber-600",
										children: ["Подробнее", /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" })]
									})
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs(Tabs, {
				defaultValue: "summary",
				children: [
					/* @__PURE__ */ jsxs(TabsList, {
						className: "no-print",
						children: [
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
							}),
							period === "month" && /* @__PURE__ */ jsx(TabsTrigger, {
								value: "table",
								children: "Сводная таблица"
							})
						]
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "summary",
						className: "mt-4",
						children: /* @__PURE__ */ jsx(ExpensesBlock, {
							expenses,
							fromIso,
							toIso,
							defaultDate: fromIso,
							periodLabel
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
							effPayout,
							periodLabel
						})
					}),
					/* @__PURE__ */ jsx(TabsContent, {
						value: "services",
						className: "mt-4",
						children: /* @__PURE__ */ jsx(ServicesBlock, {
							appts: doneAppts,
							effPayout
						})
					}),
					period === "month" && /* @__PURE__ */ jsx(TabsContent, {
						value: "table",
						className: "mt-4",
						children: /* @__PURE__ */ jsx(ExpensesMonthlyTable, {
							month: startOfMonth(anchor),
							appts: doneAppts,
							mechanics,
							advances,
							mechById,
							svcById
						})
					})
				]
			}),
			/* @__PURE__ */ jsx(ExpensesDrillDown, {
				metric: drill,
				onClose: () => setDrill(null),
				onOpenMetric: (m) => setDrill(m),
				periodLabel,
				rangeLabel,
				appts,
				doneAppts,
				upcomingAppts,
				payments,
				expenses,
				advances,
				mechanics,
				mechById,
				svcById,
				revenue,
				mechanicsAccrued,
				otherExpenses,
				cashProfit
			})
		]
	});
}
function RangePicker({ period, setPeriod, anchor, setAnchor }) {
	const step = (dir) => {
		if (period === "day") setAnchor(addDays(anchor, dir));
		else if (period === "week") setAnchor(addWeeks(anchor, dir));
		else setAnchor(addMonths(anchor, dir));
	};
	const label = (() => {
		if (period === "day") return format(anchor, "d MMM yyyy", { locale: ru });
		if (period === "week") {
			const s = startOfWeek(anchor, { weekStartsOn: 1 });
			const e = endOfWeek(anchor, { weekStartsOn: 1 });
			const sameMonth = s.getMonth() === e.getMonth();
			return `${format(s, "d")}${sameMonth ? "" : " " + format(s, "MMM", { locale: ru })} – ${format(e, "d MMM yyyy", { locale: ru })}`;
		}
		return format(anchor, "LLLL yyyy", { locale: ru });
	})();
	const todayLabel = period === "day" ? "Сегодня" : period === "week" ? "Эта неделя" : "Этот месяц";
	const isNow = (() => {
		const now = /* @__PURE__ */ new Date();
		if (period === "day") return isSameDay(anchor, now);
		if (period === "week") return isSameDay(startOfWeek(anchor, { weekStartsOn: 1 }), startOfWeek(now, { weekStartsOn: 1 }));
		return anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth();
	})();
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ jsx(Tabs, {
			value: period,
			onValueChange: (v) => setPeriod(v),
			children: /* @__PURE__ */ jsxs(TabsList, { children: [
				/* @__PURE__ */ jsx(TabsTrigger, {
					value: "day",
					children: "День"
				}),
				/* @__PURE__ */ jsx(TabsTrigger, {
					value: "week",
					children: "Неделя"
				}),
				/* @__PURE__ */ jsx(TabsTrigger, {
					value: "month",
					children: "Месяц"
				})
			] })
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1 rounded-lg border bg-card px-2 py-1",
			children: [
				/* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon",
					onClick: () => step(-1),
					children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
				}),
				/* @__PURE__ */ jsx("div", {
					className: "min-w-[150px] text-center text-sm font-medium capitalize",
					children: label
				}),
				/* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon",
					onClick: () => step(1),
					children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
				}),
				/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					size: "sm",
					className: "ml-1",
					disabled: isNow,
					onClick: () => setAnchor(/* @__PURE__ */ new Date()),
					children: todayLabel
				})
			]
		})]
	});
}
function ExpensesBlock({ expenses, fromIso, toIso, defaultDate, periodLabel }) {
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
				}), expenses.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground",
					children: [
						"За этот ",
						periodLabel === "день" ? "день" : periodLabel === "неделю" ? "неделю" : "месяц",
						" ещё нет записей о расходах."
					]
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
function MechanicsBlock({ mechanics, appts, advances, fromIso, toIso, apptPayout, periodLabel }) {
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
