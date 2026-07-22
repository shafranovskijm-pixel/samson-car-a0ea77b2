import { $ as updateBrand, D as deleteServicePrice, E as deleteService, I as listBrands, L as listCarModels, X as listServices, Y as listServicePrices, _ as deleteBrand, a as createBrand, m as createService, s as createCarModel, st as updateService, tt as updateCarModel, ut as upsertServicePrice, y as deleteCarModel } from "./api-BaCLxPcN.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { n as useConfirm } from "./ConfirmDialog-ClPPfBvs.js";
import { t as Route } from "./settings-DNEa1028.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { l as TIER_LABEL, u as TIER_OPTIONS } from "./types-0Ylr05H_.js";
import { a as dbListModifications, n as dbDeleteModification, o as dbListYearsForBrand } from "./carsCatalogDb-0r0YjLSx.js";
import { t as ModificationForm } from "./ModificationForm-BvfiNeQd.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.js";
import * as React from "react";
import { useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Pencil, Plus, Save, Settings2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
//#region src/components/ui/table.tsx
var Table = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	className: "relative w-full overflow-auto",
	children: /* @__PURE__ */ jsx("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	})
}));
Table.displayName = "Table";
var TableHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
var TableBody = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
var TableFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("tfoot", {
	ref,
	className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
var TableRow = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("tr", {
	ref,
	className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
	...props
}));
TableRow.displayName = "TableRow";
var TableHead = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("th", {
	ref,
	className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableHead.displayName = "TableHead";
var TableCell = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("td", {
	ref,
	className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableCell.displayName = "TableCell";
var TableCaption = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("caption", {
	ref,
	className: cn("mt-4 text-sm text-muted-foreground", className),
	...props
}));
TableCaption.displayName = "TableCaption";
//#endregion
//#region src/routes/settings.tsx?tsr-split=component
function SettingsPage() {
	const { tab } = Route.useSearch();
	const navigate = Route.useNavigate();
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-4",
			children: [/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-bold",
				children: "Настройки калькулятора"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Марки и модели авто, услуги и цены — всё, что участвует в расчёте."
			})]
		}), /* @__PURE__ */ jsxs(Tabs, {
			value: tab === "services" ? "services" : "brands",
			onValueChange: (v) => navigate({ search: { tab: v } }),
			className: "w-full",
			children: [
				/* @__PURE__ */ jsxs(TabsList, { children: [/* @__PURE__ */ jsx(TabsTrigger, {
					value: "brands",
					children: "Марки авто"
				}), /* @__PURE__ */ jsx(TabsTrigger, {
					value: "services",
					children: "Услуги и цены"
				})] }),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "brands",
					className: "mt-4",
					children: /* @__PURE__ */ jsx(BrandsTab, {})
				}),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "services",
					className: "mt-4",
					children: /* @__PURE__ */ jsx(ServicesTab, {})
				})
			]
		})]
	});
}
function BrandsTab() {
	const qc = useQueryClient();
	const { data: brands = [] } = useQuery({
		queryKey: ["brands"],
		queryFn: listBrands
	});
	const [newName, setNewName] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [editName, setEditName] = useState("");
	const [modelsOf, setModelsOf] = useState(null);
	const invalidate = () => qc.invalidateQueries({ queryKey: ["brands"] });
	const createM = useMutation({
		mutationFn: () => createBrand(newName.trim()),
		onSuccess: () => {
			toast.success("Добавлено");
			setNewName("");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const updM = useMutation({
		mutationFn: () => updateBrand(editingId, editName.trim()),
		onSuccess: () => {
			toast.success("Обновлено");
			setEditingId(null);
			invalidate();
		}
	});
	const delM = useMutation({
		mutationFn: (id) => deleteBrand(id),
		onSuccess: () => {
			toast.success("Удалено");
			invalidate();
		}
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-2xl",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-4 flex gap-2",
				children: [/* @__PURE__ */ jsx(Input, {
					placeholder: "Название марки",
					value: newName,
					onChange: (e) => setNewName(e.target.value),
					onKeyDown: (e) => e.key === "Enter" && newName.trim() && createM.mutate()
				}), /* @__PURE__ */ jsxs(Button, {
					onClick: () => newName.trim() && createM.mutate(),
					children: [/* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }), "Добавить"]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "divide-y rounded-lg border bg-card",
				children: [brands.map((b) => /* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-2 p-2",
					children: editingId === b.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx(Input, {
							value: editName,
							onChange: (e) => setEditName(e.target.value)
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							onClick: () => updM.mutate(),
							children: /* @__PURE__ */ jsx(Save, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => setEditingId(null),
							children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
						})
					] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ jsx("div", {
								className: "font-medium",
								children: b.name
							}), b.tier && /* @__PURE__ */ jsxs("div", {
								className: "text-xs text-muted-foreground",
								children: ["Класс: ", TIER_LABEL[b.tier] ?? b.tier]
							})]
						}),
						/* @__PURE__ */ jsxs(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => setModelsOf(b),
							children: [/* @__PURE__ */ jsx(Car, { className: "mr-2 h-4 w-4" }), "Модели"]
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => {
								setEditingId(b.id);
								setEditName(b.name);
							},
							children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => {
								if (confirm(`Удалить марку «${b.name}»?`)) delM.mutate(b.id);
							},
							children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
						})
					] })
				}, b.id)), brands.length === 0 && /* @__PURE__ */ jsx("div", {
					className: "p-6 text-center text-sm text-muted-foreground",
					children: "Нет марок"
				})]
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: !!modelsOf,
				onOpenChange: (v) => !v && setModelsOf(null),
				children: /* @__PURE__ */ jsxs(DialogContent, {
					className: "max-w-xl",
					children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: ["Модели · ", modelsOf?.name] }) }), modelsOf && /* @__PURE__ */ jsx(ModelsManager, { brand: modelsOf })]
				})
			})
		]
	});
}
function ModelsManager({ brand }) {
	const qc = useQueryClient();
	const key = ["car-models", brand.id];
	const { data: models = [] } = useQuery({
		queryKey: key,
		queryFn: () => listCarModels(brand.id)
	});
	const [name, setName] = useState("");
	const [tier, setTier] = useState("inherit");
	const [editId, setEditId] = useState(null);
	const [editName, setEditName] = useState("");
	const [editTier, setEditTier] = useState("inherit");
	const [modsOfModel, setModsOfModel] = useState(null);
	const invalidate = () => qc.invalidateQueries({ queryKey: key });
	const createM = useMutation({
		mutationFn: () => createCarModel({
			brand_id: brand.id,
			name: name.trim(),
			tier: tier === "inherit" ? null : tier
		}),
		onSuccess: () => {
			toast.success("Модель добавлена");
			setName("");
			setTier("inherit");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const updM = useMutation({
		mutationFn: () => updateCarModel(editId, {
			name: editName.trim(),
			tier: editTier === "inherit" ? null : editTier
		}),
		onSuccess: () => {
			toast.success("Сохранено");
			setEditId(null);
			invalidate();
		}
	});
	const delM = useMutation({
		mutationFn: (id) => deleteCarModel(id),
		onSuccess: () => {
			toast.success("Удалено");
			invalidate();
		}
	});
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex gap-2",
			children: [
				/* @__PURE__ */ jsx(Input, {
					placeholder: "Модель, напр. Camry",
					value: name,
					onChange: (e) => setName(e.target.value),
					onKeyDown: (e) => e.key === "Enter" && name.trim() && createM.mutate()
				}),
				/* @__PURE__ */ jsxs(Select, {
					value: tier,
					onValueChange: setTier,
					children: [/* @__PURE__ */ jsx(SelectTrigger, {
						className: "w-40",
						children: /* @__PURE__ */ jsx(SelectValue, {})
					}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsxs(SelectItem, {
						value: "inherit",
						children: ["По марке · ", brand.tier ? TIER_LABEL[brand.tier] : "—"]
					}), TIER_OPTIONS.map((t) => /* @__PURE__ */ jsx(SelectItem, {
						value: t,
						children: TIER_LABEL[t]
					}, t))] })]
				}),
				/* @__PURE__ */ jsx(Button, {
					onClick: () => name.trim() && createM.mutate(),
					children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
				})
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "max-h-96 divide-y overflow-auto rounded border",
			children: [models.map((m) => {
				const effTier = m.tier ?? brand.tier;
				return /* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-2 p-2 text-sm",
					children: editId === m.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx(Input, {
							value: editName,
							onChange: (e) => setEditName(e.target.value),
							className: "flex-1"
						}),
						/* @__PURE__ */ jsxs(Select, {
							value: editTier,
							onValueChange: setEditTier,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "w-36",
								children: /* @__PURE__ */ jsx(SelectValue, {})
							}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
								value: "inherit",
								children: "По марке"
							}), TIER_OPTIONS.map((t) => /* @__PURE__ */ jsx(SelectItem, {
								value: t,
								children: TIER_LABEL[t]
							}, t))] })]
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							onClick: () => updM.mutate(),
							children: /* @__PURE__ */ jsx(Save, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => setEditId(null),
							children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
						})
					] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx("div", {
							className: "flex-1",
							children: m.name
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "text-xs text-muted-foreground",
							children: [effTier ? TIER_LABEL[effTier] : "—", m.tier ? "" : " · по марке"]
						}),
						/* @__PURE__ */ jsxs(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => setModsOfModel(m.name),
							children: [/* @__PURE__ */ jsx(Settings2, { className: "mr-1 h-4 w-4" }), "Модификации"]
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => {
								setEditId(m.id);
								setEditName(m.name);
								setEditTier(m.tier ?? "inherit");
							},
							children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => {
								if (confirm(`Удалить модель «${m.name}»?`)) delM.mutate(m.id);
							},
							children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
						})
					] })
				}, m.id);
			}), models.length === 0 && /* @__PURE__ */ jsx("div", {
				className: "p-6 text-center text-muted-foreground",
				children: "Нет моделей"
			})]
		}),
		/* @__PURE__ */ jsx(Dialog, {
			open: !!modsOfModel,
			onOpenChange: (v) => !v && setModsOfModel(null),
			children: /* @__PURE__ */ jsxs(DialogContent, {
				className: "max-w-2xl",
				children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
					"Модификации · ",
					brand.name,
					" ",
					modsOfModel
				] }) }), modsOfModel && /* @__PURE__ */ jsx(ModificationsManager, {
					brand: brand.name,
					modelName: modsOfModel
				})]
			})
		})
	] });
}
function ModificationsManager({ brand, modelName }) {
	const qc = useQueryClient();
	const confirm = useConfirm();
	const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
	const [year, setYear] = useState(currentYear);
	const [yearInput, setYearInput] = useState(String(currentYear));
	const [adding, setAdding] = useState(false);
	const { data: years = [] } = useQuery({
		queryKey: ["catalog-years", brand],
		queryFn: () => dbListYearsForBrand(brand)
	});
	const { data: mods = [] } = useQuery({
		queryKey: [
			"catalog-mods",
			brand,
			year,
			modelName
		],
		queryFn: () => dbListModifications(brand, year, modelName)
	});
	const invalidate = () => {
		qc.invalidateQueries({ queryKey: [
			"catalog-mods",
			brand,
			year,
			modelName
		] });
		qc.invalidateQueries({ queryKey: ["catalog-years", brand] });
		qc.invalidateQueries({ queryKey: [
			"catalog-models",
			brand,
			year
		] });
	};
	const removeMod = async (m) => {
		if (!await confirm({
			title: "Удалить модификацию?",
			description: `${m.body_code ?? ""} ${m.engine_code ?? ""} ${m.displacement_cc ?? ""}`.trim() || "Модификация будет удалена без возможности восстановления.",
			confirmText: "Удалить",
			destructive: true
		})) return;
		try {
			await dbDeleteModification(m.id);
			toast.success("Удалено");
			invalidate();
		} catch (e) {
			toast.error(e.message);
		}
	};
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex flex-wrap items-end gap-2",
			children: [
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Год" }), /* @__PURE__ */ jsx(Input, {
					type: "number",
					className: "w-28",
					value: yearInput,
					onChange: (e) => {
						setYearInput(e.target.value);
						const n = Number(e.target.value);
						if (n >= 1900 && n <= 2100) setYear(n);
					}
				})] }),
				years.length > 0 && /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-1",
					children: years.map((y) => /* @__PURE__ */ jsx(Button, {
						size: "sm",
						variant: y === year ? "default" : "outline",
						onClick: () => {
							setYear(y);
							setYearInput(String(y));
						},
						children: y
					}, y))
				}),
				/* @__PURE__ */ jsx("div", {
					className: "ml-auto",
					children: /* @__PURE__ */ jsxs(Button, {
						size: "sm",
						onClick: () => setAdding((v) => !v),
						children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), adding ? "Отмена" : "Добавить модификацию"]
					})
				})
			]
		}),
		adding && /* @__PURE__ */ jsx("div", {
			className: "mb-3",
			children: /* @__PURE__ */ jsx(ModificationForm, {
				brand,
				modelName,
				year,
				onCancel: () => setAdding(false),
				onSaved: () => {
					setAdding(false);
					invalidate();
				}
			})
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "max-h-96 divide-y overflow-auto rounded border",
			children: [mods.map((m) => /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 p-2 text-sm",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex-1",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "font-medium",
							children: [
								m.body_code ?? "—",
								" ",
								m.engine_code ? `· ${m.engine_code}` : ""
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "text-xs text-muted-foreground",
							children: [
								m.displacement_cc ? `${m.displacement_cc} cc` : "",
								m.horsepower ? ` · ${m.horsepower} л.с.` : "",
								m.fuel ? ` · ${m.fuel}` : "",
								m.hybrid ? " · гибрид" : "",
								m.steering ? ` · ${m.steering}` : ""
							]
						}),
						m.note && /* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground/80",
							children: m.note
						})
					]
				}), /* @__PURE__ */ jsx(Button, {
					size: "icon",
					variant: "ghost",
					onClick: () => removeMod(m),
					children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
				})]
			}, m.id)), mods.length === 0 && /* @__PURE__ */ jsxs("div", {
				className: "p-6 text-center text-muted-foreground",
				children: [
					"Нет модификаций за ",
					year,
					" год"
				]
			})]
		})
	] });
}
function ServicesTab() {
	const qc = useQueryClient();
	const { data: services = [] } = useQuery({
		queryKey: ["services"],
		queryFn: listServices
	});
	const { data: brands = [] } = useQuery({
		queryKey: ["brands"],
		queryFn: listBrands
	});
	const [prices, setPrices] = useState({});
	const [durations, setDurations] = useState({});
	const [payouts, setPayouts] = useState({});
	const [pricesOpen, setPricesOpen] = useState(null);
	const [newOpen, setNewOpen] = useState(false);
	const [newForm, setNewForm] = useState({
		name: "",
		category: "",
		base_price: 0,
		duration_minutes: 60
	});
	const categories = useMemo(() => Array.from(new Set(services.map((s) => s.category))), [services]);
	const updM = useMutation({
		mutationFn: (v) => updateService(v.id, v),
		onSuccess: () => {
			toast.success("Обновлено");
			qc.invalidateQueries({ queryKey: ["services"] });
		}
	});
	const delM = useMutation({
		mutationFn: (id) => deleteService(id),
		onSuccess: () => {
			toast.success("Удалено");
			qc.invalidateQueries({ queryKey: ["services"] });
		}
	});
	const createM = useMutation({
		mutationFn: () => createService(newForm),
		onSuccess: () => {
			toast.success("Добавлено");
			qc.invalidateQueries({ queryKey: ["services"] });
			setNewOpen(false);
			setNewForm({
				name: "",
				category: "",
				base_price: 0,
				duration_minutes: 60
			});
		}
	});
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("div", {
			className: "mb-4 flex items-center justify-end",
			children: /* @__PURE__ */ jsxs(Button, {
				onClick: () => setNewOpen(true),
				children: [/* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }), "Добавить услугу"]
			})
		}),
		categories.map((cat) => /* @__PURE__ */ jsxs("div", {
			className: "mb-6",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "mb-2 text-lg font-semibold",
				children: cat
			}), /* @__PURE__ */ jsx("div", {
				className: "rounded-lg border bg-card",
				children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableHead, { children: "Услуга" }),
					/* @__PURE__ */ jsx(TableHead, {
						className: "w-32",
						children: "Базовая цена, ₽"
					}),
					/* @__PURE__ */ jsx(TableHead, {
						className: "w-24",
						children: "Длит., мин"
					}),
					/* @__PURE__ */ jsx(TableHead, {
						className: "w-28",
						children: "% мастеру"
					}),
					/* @__PURE__ */ jsx(TableHead, { className: "w-64" })
				] }) }), /* @__PURE__ */ jsx(TableBody, { children: services.filter((s) => s.category === cat).map((s) => {
					const svcPct = Number(s.default_payout_percent ?? 50);
					const price = prices[s.id] ?? s.base_price;
					const dur = durations[s.id] ?? s.duration_minutes;
					const pct = payouts[s.id] ?? svcPct;
					const changed = price !== s.base_price || dur !== s.duration_minutes || pct !== svcPct;
					return /* @__PURE__ */ jsxs(TableRow, { children: [
						/* @__PURE__ */ jsx(TableCell, {
							className: "font-medium",
							children: s.name
						}),
						/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Input, {
							type: "number",
							value: price,
							onChange: (e) => setPrices({
								...prices,
								[s.id]: Number(e.target.value)
							})
						}) }),
						/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Input, {
							type: "number",
							value: dur,
							onChange: (e) => setDurations({
								...durations,
								[s.id]: Number(e.target.value)
							})
						}) }),
						/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Input, {
							type: "number",
							value: pct,
							onChange: (e) => setPayouts({
								...payouts,
								[s.id]: Number(e.target.value)
							})
						}) }),
						/* @__PURE__ */ jsxs(TableCell, {
							className: "flex gap-1",
							children: [
								/* @__PURE__ */ jsxs(Button, {
									size: "sm",
									disabled: !changed,
									onClick: () => updM.mutate({
										id: s.id,
										base_price: price,
										duration_minutes: dur,
										default_payout_percent: pct
									}),
									children: [/* @__PURE__ */ jsx(Save, { className: "mr-1 h-4 w-4" }), "Сохранить"]
								}),
								/* @__PURE__ */ jsx(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => setPricesOpen(s.id),
									children: "Цены по маркам"
								}),
								/* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => {
										if (confirm(`Удалить услугу «${s.name}»?`)) delM.mutate(s.id);
									},
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
								})
							]
						})
					] }, s.id);
				}) })] })
			})]
		}, cat)),
		services.length === 0 && /* @__PURE__ */ jsx("div", {
			className: "rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground",
			children: "Пока нет услуг — добавьте первую."
		}),
		/* @__PURE__ */ jsx(BrandPricesDialog, {
			serviceId: pricesOpen,
			onClose: () => setPricesOpen(null),
			brands,
			baseService: services.find((s) => s.id === pricesOpen)
		}),
		/* @__PURE__ */ jsx(Dialog, {
			open: newOpen,
			onOpenChange: setNewOpen,
			children: /* @__PURE__ */ jsxs(DialogContent, { children: [
				/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Новая услуга" }) }),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-3",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx(Label, { children: "Категория" }),
							/* @__PURE__ */ jsx(Input, {
								list: "cats",
								value: newForm.category,
								onChange: (e) => setNewForm({
									...newForm,
									category: e.target.value
								})
							}),
							/* @__PURE__ */ jsx("datalist", {
								id: "cats",
								children: categories.map((c) => /* @__PURE__ */ jsx("option", { value: c }, c))
							})
						] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Название" }), /* @__PURE__ */ jsx(Input, {
							value: newForm.name,
							onChange: (e) => setNewForm({
								...newForm,
								name: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Цена, ₽" }), /* @__PURE__ */ jsx(Input, {
								type: "number",
								value: newForm.base_price,
								onChange: (e) => setNewForm({
									...newForm,
									base_price: Number(e.target.value)
								})
							})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Длит., мин" }), /* @__PURE__ */ jsx(Input, {
								type: "number",
								value: newForm.duration_minutes,
								onChange: (e) => setNewForm({
									...newForm,
									duration_minutes: Number(e.target.value)
								})
							})] })]
						})
					]
				}),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: () => setNewOpen(false),
					children: "Отмена"
				}), /* @__PURE__ */ jsx(Button, {
					onClick: () => {
						if (!newForm.name.trim() || !newForm.category.trim()) return toast.error("Заполните название и категорию");
						createM.mutate();
					},
					children: "Добавить"
				})] })
			] })
		})
	] });
}
function BrandPricesDialog({ serviceId, onClose, brands, baseService }) {
	const qc = useQueryClient();
	const { data: overrides = [] } = useQuery({
		queryKey: ["service_prices", serviceId],
		queryFn: () => listServicePrices(serviceId),
		enabled: !!serviceId
	});
	const [brandId, setBrandId] = useState("");
	const [price, setPrice] = useState(0);
	const addM = useMutation({
		mutationFn: () => upsertServicePrice(serviceId, brandId, price),
		onSuccess: () => {
			toast.success("Сохранено");
			qc.invalidateQueries({ queryKey: ["service_prices", serviceId] });
			setBrandId("");
			setPrice(0);
		}
	});
	const delM = useMutation({
		mutationFn: (bid) => deleteServicePrice(serviceId, bid),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["service_prices", serviceId] })
	});
	return /* @__PURE__ */ jsx(Dialog, {
		open: !!serviceId,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-w-lg",
			children: [
				/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Цены по маркам" }) }),
				/* @__PURE__ */ jsxs("div", {
					className: "text-sm text-muted-foreground",
					children: [
						baseService?.name,
						" · базовая: ",
						baseService?.base_price,
						" ₽"
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3 space-y-2 max-h-64 overflow-auto",
					children: [overrides.map((o) => {
						return /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 rounded border p-2",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "flex-1 text-sm",
									children: brands.find((x) => x.id === o.brand_id)?.name
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "text-sm font-medium",
									children: [o.price, " ₽"]
								}),
								/* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => delM.mutate(o.brand_id),
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
								})
							]
						}, o.brand_id);
					}), overrides.length === 0 && /* @__PURE__ */ jsx("div", {
						className: "text-sm text-muted-foreground",
						children: "Переопределений нет"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3 flex gap-2",
					children: [
						/* @__PURE__ */ jsxs(Select, {
							value: brandId,
							onValueChange: setBrandId,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "flex-1",
								children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Марка" })
							}), /* @__PURE__ */ jsx(SelectContent, { children: brands.filter((b) => !overrides.some((o) => o.brand_id === b.id)).map((b) => /* @__PURE__ */ jsx(SelectItem, {
								value: b.id,
								children: b.name
							}, b.id)) })]
						}),
						/* @__PURE__ */ jsx(Input, {
							type: "number",
							className: "w-32",
							value: price,
							onChange: (e) => setPrice(Number(e.target.value)),
							placeholder: "Цена"
						}),
						/* @__PURE__ */ jsx(Button, {
							disabled: !brandId || !price,
							onClick: () => addM.mutate(),
							children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
						})
					]
				}),
				/* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: onClose,
					children: "Закрыть"
				}) })
			]
		})
	});
}
//#endregion
export { SettingsPage as component };
