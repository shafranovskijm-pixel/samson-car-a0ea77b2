import { A as humanizeSupabaseError, B as listClients, F as listAppointmentsByClient, I as listBrands, L as listCarModels, R as listCars, a as createBrand, b as deleteClient, c as createClient, et as updateCar, j as listAllClientComments, l as createClientComment, nt as updateClient, o as createCar, rt as updateClientComment, v as deleteCar, x as deleteClientComment, z as listClientComments } from "./api-BaCLxPcN.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { t as Textarea } from "./textarea-kko37XEX.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { n as CLIENT_CATEGORY_LABELS, r as CLIENT_CATEGORY_ORDER, s as STATUS_LABELS, t as CLIENT_CATEGORY_COLORS } from "./types-0Ylr05H_.js";
import { a as dbListModifications, r as dbEnsureModel, t as dbAddModification } from "./carsCatalogDb-0r0YjLSx.js";
import { a as CommandItem, c as PopoverContent, i as CommandInput, l as PopoverTrigger, n as CommandEmpty, o as CommandList, r as CommandGroup, s as Popover, t as Command } from "./command-DqQJ5kpE.js";
import { i as DropdownMenuTrigger, n as DropdownMenuContent, r as DropdownMenuItem, t as DropdownMenu } from "./dropdown-menu-NQwLQ7z6.js";
import { t as ModificationForm } from "./ModificationForm-BvfiNeQd.js";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Archive, ArchiveRestore, ArrowLeft, Briefcase, Calculator, Car, Check, ChevronDown, ChevronsUpDown, Crown, Filter, Heart, History, Mail, MessageSquare, Pencil, Phone, Plus, Search, Sparkles, Trash2, User } from "lucide-react";
import { toast } from "sonner";
//#region src/routes/clients.tsx?tsr-split=component
var CATEGORY_ICONS = {
	regular: User,
	vip: Crown,
	new: Sparkles,
	problem: AlertTriangle,
	corporate: Briefcase,
	friend: Heart
};
var normalizeCategory = (raw) => {
	const v = raw ?? "regular";
	return v in CATEGORY_ICONS ? v : "regular";
};
function ClientsPage() {
	const qc = useQueryClient();
	const navigate = useNavigate();
	const [pickCarOpen, setPickCarOpen] = useState(false);
	const { data: clients = [] } = useQuery({
		queryKey: ["clients"],
		queryFn: listClients
	});
	const { data: cars = [] } = useQuery({
		queryKey: ["cars"],
		queryFn: listCars
	});
	const { data: brands = [] } = useQuery({
		queryKey: ["brands"],
		queryFn: listBrands
	});
	const { data: allComments = [] } = useQuery({
		queryKey: ["client_comments", "all"],
		queryFn: listAllClientComments
	});
	const [selectedId, setSelectedId] = useState(null);
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState("active");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [clientDialog, setClientDialog] = useState({
		open: false,
		editing: null
	});
	const [clientForm, setClientForm] = useState({
		full_name: "",
		phone: "",
		email: "",
		address: "",
		birthday: "",
		telegram: "",
		note: "",
		category: "regular"
	});
	const [customFields, setCustomFields] = useState([]);
	const [carDialog, setCarDialog] = useState({
		open: false,
		editing: null,
		clientId: ""
	});
	const activeCount = useMemo(() => clients.filter((c) => !c.is_archived).length, [clients]);
	const archivedCount = clients.length - activeCount;
	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		let byTab = clients.filter((c) => tab === "archived" ? c.is_archived : !c.is_archived);
		if (categoryFilter !== "all") byTab = byTab.filter((c) => normalizeCategory(c.category) === categoryFilter);
		if (!q) return byTab;
		const carClientIds = new Set(cars.filter((car) => (car.license_plate ?? "").toLowerCase().replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))).map((car) => car.client_id));
		const commentClientIds = new Set(allComments.filter((cm) => (cm.body ?? "").toLowerCase().includes(q)).map((cm) => cm.client_id));
		return byTab.filter((c) => c.full_name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q) || carClientIds.has(c.id) || commentClientIds.has(c.id));
	}, [
		clients,
		search,
		tab,
		categoryFilter,
		cars,
		allComments
	]);
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (window.matchMedia("(max-width: 767px)").matches) return;
		if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
	}, [selectedId, filtered]);
	const selected = clients.find((c) => c.id === selectedId) ?? null;
	const selectedCars = useMemo(() => selected ? cars.filter((c) => c.client_id === selected.id) : [], [cars, selected]);
	const carsCountByClient = useMemo(() => {
		const m = {};
		cars.forEach((c) => {
			m[c.client_id] = (m[c.client_id] ?? 0) + 1;
		});
		return m;
	}, [cars]);
	const openNewClient = () => {
		setClientDialog({
			open: true,
			editing: null
		});
		setClientForm({
			full_name: "",
			phone: "",
			email: "",
			address: "",
			birthday: "",
			telegram: "",
			note: "",
			category: "regular"
		});
		setCustomFields([]);
	};
	const openEditClient = (c) => {
		setClientDialog({
			open: true,
			editing: c
		});
		setClientForm({
			full_name: c.full_name,
			phone: c.phone ?? "",
			email: c.email ?? "",
			address: c.address ?? "",
			birthday: c.birthday ?? "",
			telegram: c.telegram ?? "",
			note: c.note ?? "",
			category: normalizeCategory(c.category)
		});
		const cf = c.custom_fields ?? {};
		setCustomFields(Object.entries(cf).map(([key, value]) => ({
			key,
			value: String(value ?? "")
		})));
	};
	const saveClientM = useMutation({
		mutationFn: async () => {
			const cf = {};
			customFields.forEach((f) => {
				const k = f.key.trim();
				if (k) cf[k] = f.value.trim();
			});
			const payload = {
				full_name: clientForm.full_name.trim(),
				phone: clientForm.phone.trim() || null,
				email: clientForm.email.trim() || null,
				address: clientForm.address.trim() || null,
				birthday: clientForm.birthday || null,
				telegram: clientForm.telegram.trim() || null,
				note: clientForm.note.trim() || null,
				custom_fields: cf,
				category: clientForm.category
			};
			if (!payload.full_name) throw new Error("Введите имя клиента");
			if (clientDialog.editing) {
				await updateClient(clientDialog.editing.id, payload);
				return clientDialog.editing.id;
			}
			return (await createClient(payload)).id;
		},
		onSuccess: (id) => {
			toast.success("Сохранено");
			qc.invalidateQueries({ queryKey: ["clients"] });
			setClientDialog({
				open: false,
				editing: null
			});
			setSelectedId(id);
		},
		onError: (e) => toast.error(e.message)
	});
	const delClientM = useMutation({
		mutationFn: (id) => deleteClient(id),
		onSuccess: () => {
			toast.success("Удалено");
			qc.invalidateQueries({ queryKey: ["clients"] });
			qc.invalidateQueries({ queryKey: ["cars"] });
			setSelectedId(null);
		}
	});
	const archiveM = useMutation({
		mutationFn: ({ id, is_archived }) => updateClient(id, { is_archived }),
		onSuccess: (_d, v) => {
			toast.success(v.is_archived ? "В архиве" : "Восстановлен");
			qc.invalidateQueries({ queryKey: ["clients"] });
			setSelectedId(null);
		},
		onError: (e) => toast.error(e.message)
	});
	const categoryM = useMutation({
		mutationFn: ({ id, category }) => updateClient(id, { category }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-[calc(100vh-3rem)] flex-col md:h-[calc(100vh-3rem)] md:flex-row",
		children: [
			/* @__PURE__ */ jsxs("aside", {
				className: `w-full flex-col border-r bg-muted/30 md:flex md:w-80 ${selected ? "hidden md:flex" : "flex"}`,
				children: [/* @__PURE__ */ jsxs("div", {
					className: "border-b p-3",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-2 flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("div", {
								className: "font-semibold",
								children: "Клиенты"
							}), /* @__PURE__ */ jsxs(Button, {
								size: "sm",
								onClick: openNewClient,
								children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Клиент"]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "relative",
							children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
								placeholder: "Имя, тел., email, гос. номер, коммент.",
								className: "pl-8",
								value: search,
								onChange: (e) => setSearch(e.target.value)
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-2 grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-xs",
							children: [/* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => {
									setTab("active");
									setSelectedId(null);
								},
								className: `rounded px-2 py-1 transition ${tab === "active" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`,
								children: ["Активные · ", activeCount]
							}), /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => {
									setTab("archived");
									setSelectedId(null);
								},
								className: `rounded px-2 py-1 transition ${tab === "archived" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`,
								children: ["Архив · ", archivedCount]
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-2",
							children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
								asChild: true,
								children: /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: "inline-flex w-full items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm transition hover:bg-muted",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "inline-flex items-center gap-1.5",
										children: [/* @__PURE__ */ jsx(Filter, { className: "h-3.5 w-3.5 text-muted-foreground" }), categoryFilter === "all" ? "Все категории" : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
											className: `inline-flex h-4 w-4 items-center justify-center rounded-full text-white ${CLIENT_CATEGORY_COLORS[categoryFilter]}`,
											children: (() => {
												const I = CATEGORY_ICONS[categoryFilter];
												return /* @__PURE__ */ jsx(I, { className: "h-2.5 w-2.5" });
											})()
										}), CLIENT_CATEGORY_LABELS[categoryFilter]] })]
									}), /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3 opacity-70" })]
								})
							}), /* @__PURE__ */ jsxs(DropdownMenuContent, {
								align: "start",
								className: "w-56",
								children: [/* @__PURE__ */ jsxs(DropdownMenuItem, {
									onClick: () => {
										setCategoryFilter("all");
										setSelectedId(null);
									},
									className: "gap-2",
									children: [/* @__PURE__ */ jsx(Check, { className: `h-3.5 w-3.5 ${categoryFilter === "all" ? "opacity-100" : "opacity-0"}` }), "Все категории"]
								}), CLIENT_CATEGORY_ORDER.map((c) => {
									const CIcon = CATEGORY_ICONS[c];
									return /* @__PURE__ */ jsxs(DropdownMenuItem, {
										onClick: () => {
											setCategoryFilter(c);
											setSelectedId(null);
										},
										className: "gap-2",
										children: [
											/* @__PURE__ */ jsx(Check, { className: `h-3.5 w-3.5 ${categoryFilter === c ? "opacity-100" : "opacity-0"}` }),
											/* @__PURE__ */ jsx("span", {
												className: `inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${CLIENT_CATEGORY_COLORS[c]}`,
												children: /* @__PURE__ */ jsx(CIcon, { className: "h-3 w-3" })
											}),
											CLIENT_CATEGORY_LABELS[c]
										]
									}, c);
								})]
							})] })
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex-1 overflow-auto",
					children: [filtered.length === 0 && /* @__PURE__ */ jsx("div", {
						className: "p-6 text-center text-sm text-muted-foreground",
						children: clients.length === 0 ? "Пока нет клиентов" : "Ничего не найдено"
					}), filtered.map((c) => {
						const active = c.id === selectedId;
						const cnt = carsCountByClient[c.id] ?? 0;
						const cat = normalizeCategory(c.category);
						const Icon = CATEGORY_ICONS[cat];
						return /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setSelectedId(c.id),
							className: `flex w-full items-center gap-3 border-b px-3 py-2.5 text-left text-sm transition ${active ? "bg-primary/10" : "hover:bg-muted/60"}`,
							children: [
								/* @__PURE__ */ jsx("div", {
									className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${CLIENT_CATEGORY_COLORS[cat]}`,
									title: CLIENT_CATEGORY_LABELS[cat],
									children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ jsx("div", {
										className: "truncate font-medium",
										children: c.full_name
									}), /* @__PURE__ */ jsx("div", {
										className: "truncate text-xs text-muted-foreground",
										children: c.phone ?? c.email ?? "—"
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-1 text-xs text-muted-foreground",
									children: [/* @__PURE__ */ jsx(Car, { className: "h-3 w-3" }), cnt]
								})
							]
						}, c.id);
					})]
				})]
			}),
			/* @__PURE__ */ jsx("section", {
				className: `flex-1 overflow-auto p-4 md:p-6 ${!selected ? "hidden md:block" : "block"}`,
				children: !selected ? /* @__PURE__ */ jsx("div", {
					className: "flex h-full items-center justify-center text-muted-foreground",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center",
						children: [/* @__PURE__ */ jsx(User, { className: "mx-auto mb-3 h-10 w-10 opacity-30" }), /* @__PURE__ */ jsx("div", { children: "Выберите клиента слева или добавьте нового" })]
					})
				}) : /* @__PURE__ */ jsxs("div", {
					className: "mx-auto max-w-3xl",
					children: [
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setSelectedId(null),
							className: "mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden",
							children: [/* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }), " К списку клиентов"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mb-6 flex items-start justify-between gap-4",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [
									(() => {
										const cat = normalizeCategory(selected.category);
										const Icon = CATEGORY_ICONS[cat];
										return /* @__PURE__ */ jsx("div", {
											className: "mb-2 flex items-center gap-2",
											children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
												asChild: true,
												children: /* @__PURE__ */ jsxs("button", {
													type: "button",
													className: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:opacity-90 ${CLIENT_CATEGORY_COLORS[cat]}`,
													children: [
														/* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
														CLIENT_CATEGORY_LABELS[cat],
														/* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3 opacity-80" })
													]
												})
											}), /* @__PURE__ */ jsx(DropdownMenuContent, {
												align: "start",
												children: CLIENT_CATEGORY_ORDER.map((c) => {
													const CIcon = CATEGORY_ICONS[c];
													return /* @__PURE__ */ jsxs(DropdownMenuItem, {
														onClick: () => categoryM.mutate({
															id: selected.id,
															category: c
														}),
														className: "gap-2",
														children: [
															/* @__PURE__ */ jsx(Check, { className: `h-3.5 w-3.5 ${c === cat ? "opacity-100" : "opacity-0"}` }),
															/* @__PURE__ */ jsx("span", {
																className: `inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${CLIENT_CATEGORY_COLORS[c]}`,
																children: /* @__PURE__ */ jsx(CIcon, { className: "h-3 w-3" })
															}),
															CLIENT_CATEGORY_LABELS[c]
														]
													}, c);
												})
											})] })
										});
									})(),
									/* @__PURE__ */ jsx("h1", {
										className: "text-2xl font-bold",
										children: selected.full_name
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground",
										children: [
											selected.phone && /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1",
												children: [/* @__PURE__ */ jsx(Phone, { className: "h-4 w-4" }), selected.phone]
											}),
											selected.email && /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1",
												children: [/* @__PURE__ */ jsx(Mail, { className: "h-4 w-4" }), selected.email]
											}),
											selected.telegram && /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1",
												children: ["TG: ", selected.telegram]
											}),
											selected.birthday && /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1",
												children: ["ДР: ", new Date(selected.birthday).toLocaleDateString("ru-RU")]
											}),
											selected.address && /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1",
												children: ["Адрес: ", selected.address]
											})
										]
									}),
									selected.note && /* @__PURE__ */ jsx("div", {
										className: "mt-2 rounded-md bg-muted/50 p-2 text-sm text-foreground",
										children: selected.note
									}),
									selected.custom_fields && Object.keys(selected.custom_fields).length > 0 && /* @__PURE__ */ jsx("div", {
										className: "mt-3 grid gap-1 text-sm",
										children: Object.entries(selected.custom_fields).map(([k, v]) => /* @__PURE__ */ jsxs("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ jsxs("span", {
												className: "text-muted-foreground",
												children: [k, ":"]
											}), /* @__PURE__ */ jsx("span", {
												className: "text-foreground",
												children: String(v)
											})]
										}, k))
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ jsxs(Button, {
										size: "sm",
										onClick: () => {
											if (selectedCars.length === 0) {
												toast.info("Сначала добавьте машину клиенту");
												setCarDialog({
													open: true,
													editing: null,
													clientId: selected.id
												});
												return;
											}
											if (selectedCars.length === 1) {
												navigate({
													to: "/calculator",
													search: { carId: selectedCars[0].id }
												});
												return;
											}
											setPickCarOpen(true);
										},
										children: [
											/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }),
											/* @__PURE__ */ jsx("span", {
												className: "hidden sm:inline",
												children: "Добавить услугу"
											}),
											/* @__PURE__ */ jsx("span", {
												className: "sm:hidden",
												children: "Услуга"
											})
										]
									}),
									/* @__PURE__ */ jsxs(Button, {
										variant: "outline",
										size: "sm",
										onClick: () => openEditClient(selected),
										children: [/* @__PURE__ */ jsx(Pencil, { className: "mr-1 h-4 w-4" }), "Изменить"]
									}),
									/* @__PURE__ */ jsx(Button, {
										variant: "outline",
										size: "sm",
										onClick: () => archiveM.mutate({
											id: selected.id,
											is_archived: !selected.is_archived
										}),
										children: selected.is_archived ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(ArchiveRestore, { className: "mr-1 h-4 w-4" }), "Восстановить"] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Archive, { className: "mr-1 h-4 w-4" }), "В архив"] })
									}),
									/* @__PURE__ */ jsx(Button, {
										variant: "outline",
										size: "sm",
										onClick: () => {
											if (confirm(`Удалить клиента «${selected.full_name}» и все его машины?`)) delClientM.mutate(selected.id);
										},
										children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
									})
								]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mb-3 flex items-center justify-between",
							children: [/* @__PURE__ */ jsxs("h2", {
								className: "text-lg font-semibold",
								children: ["Автомобили ", /* @__PURE__ */ jsxs("span", {
									className: "text-sm font-normal text-muted-foreground",
									children: ["· ", selectedCars.length]
								})]
							}), /* @__PURE__ */ jsxs(Button, {
								size: "sm",
								onClick: () => setCarDialog({
									open: true,
									editing: null,
									clientId: selected.id
								}),
								children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Добавить машину"]
							})]
						}),
						selectedCars.length === 0 ? /* @__PURE__ */ jsx("div", {
							className: "rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground",
							children: "У клиента ещё нет машин"
						}) : /* @__PURE__ */ jsx("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: selectedCars.map((car) => {
								return /* @__PURE__ */ jsxs("div", {
									className: "rounded-lg border bg-card p-4",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-start justify-between gap-2",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ jsxs("div", {
													className: "font-semibold",
													children: [
														brands.find((b) => b.id === car.brand_id)?.name ?? "—",
														" ",
														car.model
													]
												}), /* @__PURE__ */ jsx("div", {
													className: "mt-1 text-xs text-muted-foreground",
													children: [car.year, car.color].filter(Boolean).join(" · ") || "—"
												})]
											}), /* @__PURE__ */ jsxs("div", {
												className: "flex gap-1",
												children: [
													/* @__PURE__ */ jsx(Link, {
														to: "/calculator",
														search: { carId: car.id },
														title: "Добавить услуги в калькулятор",
														className: "inline-flex h-9 w-9 items-center justify-center rounded-md text-primary hover:bg-primary/10",
														children: /* @__PURE__ */ jsx(Calculator, { className: "h-4 w-4" })
													}),
													/* @__PURE__ */ jsx(Button, {
														size: "icon",
														variant: "ghost",
														onClick: () => setCarDialog({
															open: true,
															editing: car,
															clientId: selected.id
														}),
														children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" })
													}),
													/* @__PURE__ */ jsx(Button, {
														size: "icon",
														variant: "ghost",
														onClick: () => {
															if (confirm("Удалить машину?")) deleteCar(car.id).then(() => {
																toast.success("Удалено");
																qc.invalidateQueries({ queryKey: ["cars"] });
															});
														},
														children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
													})
												]
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground",
											children: [
												/* @__PURE__ */ jsxs("div", { children: ["Госномер: ", /* @__PURE__ */ jsx("span", {
													className: "text-foreground",
													children: car.license_plate ?? "—"
												})] }),
												/* @__PURE__ */ jsxs("div", { children: ["Пробег: ", /* @__PURE__ */ jsx("span", {
													className: "text-foreground",
													children: car.mileage != null ? `${car.mileage} км` : "—"
												})] }),
												/* @__PURE__ */ jsxs("div", { children: ["VIN: ", /* @__PURE__ */ jsx("span", {
													className: "font-mono text-foreground",
													children: car.vin ?? "—"
												})] }),
												/* @__PURE__ */ jsxs("div", { children: ["КПП: ", /* @__PURE__ */ jsx("span", {
													className: "text-foreground",
													children: car.transmission ?? "—"
												})] })
											]
										}),
										/* @__PURE__ */ jsxs(Link, {
											to: "/calculator",
											search: { carId: car.id },
											className: "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15",
											children: [/* @__PURE__ */ jsx(Calculator, { className: "h-4 w-4" }), "Добавить услуги"]
										})
									]
								}, car.id);
							})
						}),
						/* @__PURE__ */ jsx(ClientComments, { clientId: selected.id }),
						/* @__PURE__ */ jsx(ClientHistory, { clientId: selected.id })
					]
				})
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: pickCarOpen,
				onOpenChange: setPickCarOpen,
				children: /* @__PURE__ */ jsxs(DialogContent, {
					className: "max-w-md",
					children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Выберите машину" }) }), /* @__PURE__ */ jsx("div", {
						className: "grid gap-2",
						children: selectedCars.map((car) => {
							return /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => {
									setPickCarOpen(false);
									navigate({
										to: "/calculator",
										search: { carId: car.id }
									});
								},
								className: "flex flex-col items-start gap-0.5 rounded-md border bg-card px-3 py-2 text-left hover:bg-accent",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "font-medium",
									children: [
										brands.find((b) => b.id === car.brand_id)?.name ?? "—",
										" ",
										car.model
									]
								}), /* @__PURE__ */ jsx("span", {
									className: "text-xs text-muted-foreground",
									children: [car.year, car.license_plate ?? "—"].filter(Boolean).join(" · ")
								})]
							}, car.id);
						})
					})]
				})
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: clientDialog.open,
				onOpenChange: (o) => setClientDialog((s) => ({
					...s,
					open: o
				})),
				children: /* @__PURE__ */ jsxs(DialogContent, {
					className: "max-h-[90vh] max-w-lg overflow-y-auto",
					children: [
						/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: clientDialog.editing ? "Редактировать клиента" : "Новый клиент" }) }),
						/* @__PURE__ */ jsxs("div", {
							className: "grid gap-3",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "ФИО" }), /* @__PURE__ */ jsx(Input, {
									value: clientForm.full_name,
									onChange: (e) => setClientForm({
										...clientForm,
										full_name: e.target.value
									})
								})] }),
								/* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Телефон" }), /* @__PURE__ */ jsx(Input, {
										value: clientForm.phone,
										onChange: (e) => setClientForm({
											...clientForm,
											phone: e.target.value
										})
									})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Email" }), /* @__PURE__ */ jsx(Input, {
										value: clientForm.email,
										onChange: (e) => setClientForm({
											...clientForm,
											email: e.target.value
										})
									})] })]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Telegram" }), /* @__PURE__ */ jsx(Input, {
										value: clientForm.telegram,
										onChange: (e) => setClientForm({
											...clientForm,
											telegram: e.target.value
										}),
										placeholder: "@username"
									})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Дата рождения" }), /* @__PURE__ */ jsx(Input, {
										type: "date",
										value: clientForm.birthday,
										onChange: (e) => setClientForm({
											...clientForm,
											birthday: e.target.value
										})
									})] })]
								}),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Адрес" }), /* @__PURE__ */ jsx(Input, {
									value: clientForm.address,
									onChange: (e) => setClientForm({
										...clientForm,
										address: e.target.value
									})
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Заметка" }), /* @__PURE__ */ jsx(Input, {
									value: clientForm.note,
									onChange: (e) => setClientForm({
										...clientForm,
										note: e.target.value
									})
								})] }),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-2 rounded-md border p-3",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "mb-2 flex items-center justify-between",
											children: [/* @__PURE__ */ jsx(Label, {
												className: "m-0",
												children: "Свои поля"
											}), /* @__PURE__ */ jsxs(Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												onClick: () => setCustomFields((prev) => [...prev, {
													key: "",
													value: ""
												}]),
												children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Добавить поле"]
											})]
										}),
										customFields.length === 0 && /* @__PURE__ */ jsx("div", {
											className: "text-xs text-muted-foreground",
											children: "Например: скидка, соцсеть, реферер"
										}),
										/* @__PURE__ */ jsx("div", {
											className: "grid gap-2",
											children: customFields.map((f, i) => /* @__PURE__ */ jsxs("div", {
												className: "flex gap-2",
												children: [
													/* @__PURE__ */ jsx(Input, {
														placeholder: "Название",
														value: f.key,
														maxLength: 50,
														onChange: (e) => setCustomFields((prev) => prev.map((x, j) => j === i ? {
															...x,
															key: e.target.value
														} : x))
													}),
													/* @__PURE__ */ jsx(Input, {
														placeholder: "Значение",
														value: f.value,
														maxLength: 500,
														onChange: (e) => setCustomFields((prev) => prev.map((x, j) => j === i ? {
															...x,
															value: e.target.value
														} : x))
													}),
													/* @__PURE__ */ jsx(Button, {
														type: "button",
														size: "icon",
														variant: "ghost",
														onClick: () => setCustomFields((prev) => prev.filter((_, j) => j !== i)),
														children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
													})
												]
											}, i))
										})
									]
								})
							]
						}),
						/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							onClick: () => setClientDialog({
								open: false,
								editing: null
							}),
							children: "Отмена"
						}), /* @__PURE__ */ jsx(Button, {
							onClick: () => saveClientM.mutate(),
							disabled: saveClientM.isPending,
							children: "Сохранить"
						})] })
					]
				})
			}),
			/* @__PURE__ */ jsx(CarDialog, {
				open: carDialog.open,
				editing: carDialog.editing,
				clientId: carDialog.clientId,
				brands,
				onClose: () => setCarDialog({
					open: false,
					editing: null,
					clientId: ""
				}),
				onSaved: () => qc.invalidateQueries({ queryKey: ["cars"] })
			})
		]
	});
}
var emptyCarForm = {
	brand_id: "",
	model: "",
	year: "",
	license_plate: "",
	vin: "",
	color: "",
	engine_volume: "",
	engine_power: "",
	transmission: "",
	drive_type: "",
	mileage: ""
};
function CarDialog({ open, editing, clientId, brands, onClose, onSaved }) {
	const qc = useQueryClient();
	const [form, setForm] = useState(emptyCarForm);
	const [brandOpen, setBrandOpen] = useState(false);
	const [brandQuery, setBrandQuery] = useState("");
	useEffect(() => {
		if (!open) return;
		if (editing) setForm({
			brand_id: editing.brand_id ?? "",
			model: editing.model,
			year: editing.year?.toString() ?? "",
			license_plate: editing.license_plate ?? "",
			vin: editing.vin ?? "",
			color: editing.color ?? "",
			engine_volume: editing.engine_volume?.toString() ?? "",
			engine_power: editing.engine_power?.toString() ?? "",
			transmission: editing.transmission ?? "",
			drive_type: editing.drive_type ?? "",
			mileage: editing.mileage?.toString() ?? ""
		});
		else setForm(emptyCarForm);
		setBrandQuery("");
	}, [open, editing]);
	const selectedBrand = brands.find((b) => b.id === form.brand_id);
	const createBrandInline = async () => {
		const name = brandQuery.trim();
		if (!name) return;
		try {
			const id = (await createBrand(name)).id;
			setForm((f) => ({
				...f,
				brand_id: id
			}));
			setBrandQuery("");
			setBrandOpen(false);
			await qc.invalidateQueries({ queryKey: ["brands"] });
			toast.success(`Марка «${name}» добавлена`);
		} catch (e) {
			toast.error(humanizeSupabaseError(e));
		}
	};
	const saveM = useMutation({
		mutationFn: async () => {
			if (!form.model.trim()) throw new Error("Введите модель");
			const modelName = form.model.trim();
			const brandName = selectedBrand?.name;
			const yearNum = form.year ? Number(form.year) : null;
			const payload = {
				client_id: clientId,
				brand_id: form.brand_id || null,
				model: modelName,
				year: yearNum,
				license_plate: form.license_plate.trim() || null,
				vin: form.vin.trim() || null,
				color: form.color.trim() || null,
				engine_volume: form.engine_volume ? Number(form.engine_volume) : null,
				engine_power: form.engine_power ? Number(form.engine_power) : null,
				transmission: form.transmission || null,
				drive_type: form.drive_type || null,
				mileage: form.mileage ? Number(form.mileage) : null
			};
			if (editing) await updateCar(editing.id, payload);
			else await createCar(payload);
			if (brandName) try {
				await dbEnsureModel(brandName, modelName);
				if (yearNum && (payload.engine_volume || payload.engine_power || payload.transmission || payload.drive_type)) {
					const cc = payload.engine_volume ? Math.round(payload.engine_volume * 1e3) : null;
					const noteParts = [payload.transmission, payload.drive_type ? `привод ${payload.drive_type}` : null].filter(Boolean);
					await dbAddModification({
						brand: brandName,
						modelName,
						year: yearNum,
						displacement_cc: cc,
						horsepower: payload.engine_power,
						note: noteParts.length ? noteParts.join(" · ") : null
					});
				}
				await Promise.all([
					qc.invalidateQueries({ queryKey: ["catalog-years", brandName] }),
					qc.invalidateQueries({ queryKey: ["catalog-models", brandName] }),
					qc.invalidateQueries({ queryKey: ["catalog-mods", brandName] })
				]);
			} catch (e) {
				console.warn("catalog sync failed", e);
			}
		},
		onSuccess: () => {
			toast.success("Сохранено");
			onSaved();
			onClose();
		},
		onError: (e) => toast.error(humanizeSupabaseError(e))
	});
	const filteredBrands = brandQuery.trim() ? brands.filter((b) => b.name.toLowerCase().includes(brandQuery.trim().toLowerCase())) : brands;
	const exactExists = brands.some((b) => b.name.toLowerCase() === brandQuery.trim().toLowerCase());
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-w-2xl",
			children: [
				/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editing ? "Редактировать машину" : "Новая машина" }) }),
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-3",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Марка" }), /* @__PURE__ */ jsxs(Popover, {
							open: brandOpen,
							onOpenChange: setBrandOpen,
							children: [/* @__PURE__ */ jsx(PopoverTrigger, {
								asChild: true,
								children: /* @__PURE__ */ jsxs(Button, {
									type: "button",
									variant: "outline",
									role: "combobox",
									className: "w-full justify-between font-normal",
									children: [/* @__PURE__ */ jsx("span", {
										className: selectedBrand ? "" : "text-muted-foreground",
										children: selectedBrand?.name ?? "Марка"
									}), /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 opacity-50" })]
								})
							}), /* @__PURE__ */ jsx(PopoverContent, {
								className: "w-[--radix-popover-trigger-width] p-0",
								align: "start",
								children: /* @__PURE__ */ jsxs(Command, {
									shouldFilter: false,
									children: [/* @__PURE__ */ jsx(CommandInput, {
										placeholder: "Поиск или новая марка…",
										value: brandQuery,
										onValueChange: setBrandQuery
									}), /* @__PURE__ */ jsxs(CommandList, { children: [
										/* @__PURE__ */ jsx(CommandEmpty, { children: brandQuery.trim() ? "Ничего не найдено" : "Нет марок" }),
										filteredBrands.length > 0 && /* @__PURE__ */ jsx(CommandGroup, { children: filteredBrands.map((b) => /* @__PURE__ */ jsxs(CommandItem, {
											value: b.name,
											onSelect: () => {
												setForm((f) => ({
													...f,
													brand_id: b.id
												}));
												setBrandOpen(false);
												setBrandQuery("");
											},
											children: [/* @__PURE__ */ jsx(Check, { className: `mr-2 h-4 w-4 ${form.brand_id === b.id ? "opacity-100" : "opacity-0"}` }), b.name]
										}, b.id)) }),
										brandQuery.trim() && !exactExists && /* @__PURE__ */ jsx(CommandGroup, { children: /* @__PURE__ */ jsxs(CommandItem, {
											value: `__add_${brandQuery}`,
											onSelect: createBrandInline,
											children: [
												/* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
												"Добавить марку «",
												brandQuery.trim(),
												"»"
											]
										}) })
									] })]
								})
							})]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx(Label, { children: "Модель" }),
							/* @__PURE__ */ jsx(Input, {
								list: form.brand_id ? `models-${form.brand_id}` : void 0,
								value: form.model,
								onChange: (e) => setForm({
									...form,
									model: e.target.value
								}),
								placeholder: form.brand_id ? "Начните вводить или выберите" : "Сначала выберите марку"
							}),
							form.brand_id && /* @__PURE__ */ jsx(ModelsDatalist, { brandId: form.brand_id })
						] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Год" }), /* @__PURE__ */ jsx(Input, {
							type: "number",
							value: form.year,
							onChange: (e) => setForm({
								...form,
								year: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Госномер" }), /* @__PURE__ */ jsx(Input, {
							value: form.license_plate,
							onChange: (e) => setForm({
								...form,
								license_plate: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsx(ModificationPicker, {
								brand: selectedBrand?.name ?? "",
								modelName: form.model,
								year: form.year ? Number(form.year) : null,
								onPick: (m) => {
									setForm((f) => ({
										...f,
										engine_volume: m.displacement_cc ? (m.displacement_cc / 1e3).toFixed(1) : f.engine_volume,
										engine_power: m.horsepower ? String(m.horsepower) : f.engine_power
									}));
								}
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "col-span-2",
							children: [/* @__PURE__ */ jsx(Label, { children: "VIN" }), /* @__PURE__ */ jsx(Input, {
								value: form.vin,
								onChange: (e) => setForm({
									...form,
									vin: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Цвет" }), /* @__PURE__ */ jsx(Input, {
							value: form.color,
							onChange: (e) => setForm({
								...form,
								color: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Пробег, км" }), /* @__PURE__ */ jsx(Input, {
							type: "number",
							value: form.mileage,
							onChange: (e) => setForm({
								...form,
								mileage: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Объём двигателя, л" }), /* @__PURE__ */ jsx(Input, {
							type: "number",
							step: "0.1",
							value: form.engine_volume,
							onChange: (e) => setForm({
								...form,
								engine_volume: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Мощность, л.с." }), /* @__PURE__ */ jsx(Input, {
							type: "number",
							value: form.engine_power,
							onChange: (e) => setForm({
								...form,
								engine_power: e.target.value
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Тип КПП" }), /* @__PURE__ */ jsxs(Select, {
							value: form.transmission,
							onValueChange: (v) => setForm({
								...form,
								transmission: v
							}),
							children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }), /* @__PURE__ */ jsxs(SelectContent, { children: [
								/* @__PURE__ */ jsx(SelectItem, {
									value: "МКПП",
									children: "МКПП"
								}),
								/* @__PURE__ */ jsx(SelectItem, {
									value: "АКПП",
									children: "АКПП"
								}),
								/* @__PURE__ */ jsx(SelectItem, {
									value: "Вариатор",
									children: "Вариатор"
								}),
								/* @__PURE__ */ jsx(SelectItem, {
									value: "Робот",
									children: "Робот"
								})
							] })]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Привод" }), /* @__PURE__ */ jsxs(Select, {
							value: form.drive_type,
							onValueChange: (v) => setForm({
								...form,
								drive_type: v
							}),
							children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }), /* @__PURE__ */ jsxs(SelectContent, { children: [
								/* @__PURE__ */ jsx(SelectItem, {
									value: "Передний",
									children: "Передний"
								}),
								/* @__PURE__ */ jsx(SelectItem, {
									value: "Задний",
									children: "Задний"
								}),
								/* @__PURE__ */ jsx(SelectItem, {
									value: "Полный",
									children: "Полный"
								})
							] })]
						})] })
					]
				}),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: onClose,
					children: "Отмена"
				}), /* @__PURE__ */ jsx(Button, {
					onClick: () => saveM.mutate(),
					children: "Сохранить"
				})] })
			]
		})
	});
}
function ModificationPicker({ brand, modelName, year, onPick }) {
	const qc = useQueryClient();
	const ready = !!(brand && modelName.trim() && year);
	const { data: mods = [], isFetching } = useQuery({
		queryKey: [
			"catalog-mods",
			brand,
			modelName,
			year
		],
		queryFn: () => dbListModifications(brand, year, modelName),
		enabled: ready
	});
	const [addOpen, setAddOpen] = useState(false);
	if (!ready) return /* @__PURE__ */ jsx("div", {
		className: "rounded-md border border-dashed p-2 text-xs text-muted-foreground",
		children: "Выберите марку, модель и год, чтобы указать модификацию."
	});
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "mb-1 flex items-center justify-between",
			children: [/* @__PURE__ */ jsx(Label, {
				className: "text-xs",
				children: "Модификация"
			}), /* @__PURE__ */ jsxs(Button, {
				type: "button",
				variant: "ghost",
				size: "sm",
				className: "h-7 px-2 text-xs",
				onClick: () => setAddOpen(true),
				children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-3 w-3" }), " Новая"]
			})]
		}),
		mods.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "rounded-md border border-dashed p-2 text-xs text-muted-foreground",
			children: isFetching ? "Загрузка…" : "Модификаций пока нет — добавьте вручную или заполните объём/мощность ниже."
		}) : /* @__PURE__ */ jsx("div", {
			className: "flex flex-wrap gap-1.5",
			children: mods.map((m) => {
				return /* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					className: "h-8 text-xs",
					onClick: () => onPick(m),
					children: [
						m.displacement_cc ? `${(m.displacement_cc / 1e3).toFixed(1)}л` : null,
						m.horsepower ? `${m.horsepower}л.с.` : null,
						m.body_code,
						m.note
					].filter(Boolean).join(" · ") || m.raw || "модификация"
				}, m.id);
			})
		}),
		/* @__PURE__ */ jsx(Dialog, {
			open: addOpen,
			onOpenChange: setAddOpen,
			children: /* @__PURE__ */ jsxs(DialogContent, {
				className: "max-w-lg",
				children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Новая модификация" }) }), /* @__PURE__ */ jsx(ModificationForm, {
					brand,
					modelName,
					year,
					onCancel: () => setAddOpen(false),
					onSaved: () => {
						setAddOpen(false);
						qc.invalidateQueries({ queryKey: [
							"catalog-mods",
							brand,
							modelName,
							year
						] });
					}
				})]
			})
		})
	] });
}
function ModelsDatalist({ brandId }) {
	const { data: models = [] } = useQuery({
		queryKey: ["car-models", brandId],
		queryFn: () => listCarModels(brandId)
	});
	return /* @__PURE__ */ jsx("datalist", {
		id: `models-${brandId}`,
		children: models.map((m) => /* @__PURE__ */ jsx("option", { value: m.name }, m.id))
	});
}
function ClientHistory({ clientId }) {
	const { data: items = [], isLoading } = useQuery({
		queryKey: ["client-history", clientId],
		queryFn: () => listAppointmentsByClient(clientId)
	});
	const [q, setQ] = useState("");
	const filtered = useMemo(() => {
		const s = q.trim().toLowerCase();
		if (!s) return items;
		return items.filter((a) => {
			return [
				new Date(a.starts_at).toLocaleString("ru-RU", {
					dateStyle: "short",
					timeStyle: "short"
				}),
				a.car?.brand?.name ?? "",
				a.car?.model ?? "",
				a.car?.license_plate ?? "",
				a.comment ?? "",
				STATUS_LABELS[a.status] ?? a.status,
				...a.services.map((sv) => sv.service?.name ?? "")
			].join(" ").toLowerCase().includes(s);
		});
	}, [items, q]);
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-8",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex flex-wrap items-center justify-between gap-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx(History, { className: "h-5 w-5" }), /* @__PURE__ */ jsxs("h2", {
					className: "text-lg font-semibold",
					children: [
						"История",
						" ",
						/* @__PURE__ */ jsxs("span", {
							className: "text-sm font-normal text-muted-foreground",
							children: [
								"· ",
								filtered.length,
								q && items.length !== filtered.length ? ` из ${items.length}` : ""
							]
						})
					]
				})]
			}), items.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "relative w-full sm:w-64",
				children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
					placeholder: "Поиск по услугам, авто, дате…",
					className: "h-9 pl-8",
					value: q,
					onChange: (e) => setQ(e.target.value)
				})]
			})]
		}), isLoading ? /* @__PURE__ */ jsx("div", {
			className: "text-sm text-muted-foreground",
			children: "Загрузка…"
		}) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground",
			children: items.length === 0 ? "Записей пока нет" : "Ничего не найдено"
		}) : /* @__PURE__ */ jsx("div", {
			className: "space-y-2",
			children: filtered.map((a) => {
				const brand = a.car?.brand?.name ?? "";
				const model = a.car?.model ?? "";
				const plate = a.car?.license_plate ? ` · ${a.car.license_plate}` : "";
				return /* @__PURE__ */ jsx("div", {
					className: "rounded-lg border bg-card p-3 text-sm",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "font-medium",
									children: new Date(a.starts_at).toLocaleString("ru-RU", {
										dateStyle: "medium",
										timeStyle: "short"
									})
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "text-xs text-muted-foreground",
									children: [
										brand,
										" ",
										model,
										plate
									]
								}),
								a.services.length > 0 && /* @__PURE__ */ jsx("div", {
									className: "mt-1 text-xs",
									children: a.services.map((s) => s.service?.name ?? "—").join(", ")
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "shrink-0 text-right",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "font-semibold",
								children: [a.total_price, " ₽"]
							}), /* @__PURE__ */ jsx("div", {
								className: "text-xs text-muted-foreground",
								children: STATUS_LABELS[a.status] ?? a.status
							})]
						})]
					})
				}, a.id);
			})
		})]
	});
}
function ClientComments({ clientId }) {
	const qc = useQueryClient();
	const { data: items = [] } = useQuery({
		queryKey: ["client-comments", clientId],
		queryFn: () => listClientComments(clientId)
	});
	const [adding, setAdding] = useState(false);
	const [draft, setDraft] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [editDraft, setEditDraft] = useState("");
	const invalidate = () => qc.invalidateQueries({ queryKey: ["client-comments", clientId] });
	const addM = useMutation({
		mutationFn: async () => {
			const body = draft.trim();
			if (!body) throw new Error("Введите текст комментария");
			await createClientComment(clientId, body);
		},
		onSuccess: () => {
			toast.success("Добавлено");
			setDraft("");
			setAdding(false);
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const updM = useMutation({
		mutationFn: async (c) => {
			const body = editDraft.trim();
			if (!body) throw new Error("Комментарий не может быть пустым");
			await updateClientComment(c.id, body);
		},
		onSuccess: () => {
			toast.success("Сохранено");
			setEditingId(null);
			setEditDraft("");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const delM = useMutation({
		mutationFn: (id) => deleteClientComment(id),
		onSuccess: () => {
			toast.success("Удалено");
			invalidate();
		}
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-8",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(MessageSquare, { className: "h-5 w-5" }), /* @__PURE__ */ jsxs("h2", {
						className: "text-lg font-semibold",
						children: [
							"Комментарии",
							" ",
							/* @__PURE__ */ jsxs("span", {
								className: "text-sm font-normal text-muted-foreground",
								children: ["· ", items.length]
							})
						]
					})]
				}), !adding && /* @__PURE__ */ jsxs(Button, {
					size: "sm",
					onClick: () => {
						setAdding(true);
						setDraft("");
					},
					children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Комментарий"]
				})]
			}),
			adding && /* @__PURE__ */ jsxs("div", {
				className: "mb-3 rounded-lg border bg-card p-3",
				children: [/* @__PURE__ */ jsx(Textarea, {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					rows: 3,
					autoFocus: true,
					placeholder: "Например: клиент любит чтобы позвонили после ТО, предпочитает наличные, машина стоит в дальнем боксе…"
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-2 flex justify-end gap-2",
					children: [/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => {
							setAdding(false);
							setDraft("");
						},
						children: "Отмена"
					}), /* @__PURE__ */ jsx(Button, {
						size: "sm",
						onClick: () => addM.mutate(),
						disabled: addM.isPending,
						children: "Сохранить"
					})]
				})]
			}),
			items.length === 0 && !adding ? /* @__PURE__ */ jsx("div", {
				className: "rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground",
				children: "Комментариев пока нет"
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-2",
				children: items.map((c) => {
					return /* @__PURE__ */ jsx("div", {
						className: "rounded-lg border bg-card p-3 text-sm",
						children: editingId === c.id ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Textarea, {
							value: editDraft,
							onChange: (e) => setEditDraft(e.target.value),
							rows: 3,
							autoFocus: true
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-2 flex justify-end gap-2",
							children: [/* @__PURE__ */ jsx(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => {
									setEditingId(null);
									setEditDraft("");
								},
								children: "Отмена"
							}), /* @__PURE__ */ jsx(Button, {
								size: "sm",
								onClick: () => updM.mutate(c),
								disabled: updM.isPending,
								children: "Сохранить"
							})]
						})] }) : /* @__PURE__ */ jsxs("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsx("div", {
									className: "whitespace-pre-wrap break-words",
									children: c.body
								}), /* @__PURE__ */ jsxs("div", {
									className: "mt-1 text-xs text-muted-foreground",
									children: [new Date(c.created_at).toLocaleString("ru-RU", {
										dateStyle: "medium",
										timeStyle: "short"
									}), c.updated_at !== c.created_at ? " · изменён" : ""]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex shrink-0 gap-1",
								children: [/* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => {
										setEditingId(c.id);
										setEditDraft(c.body);
									},
									children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" })
								}), /* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => {
										if (confirm("Удалить комментарий?")) delM.mutate(c.id);
									},
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
								})]
							})]
						})
					}, c.id);
				})
			})
		]
	});
}
//#endregion
export { ClientsPage as component };
