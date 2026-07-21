import { A as humanizeSupabaseError, B as listClients, I as listBrands, K as listMechanics, L as listCarModels, N as listAppointmentPayments, O as getAppointment, R as listCars, W as listMechanicServiceRates, X as listServices, Z as updateAppointment, g as deleteAppointmentPayment, h as deleteAppointment, i as createAppointmentPayment, k as getPriceForBrand, lt as upsertServiceByCategoryName, r as createAppointment, st as updateService } from "./api-5HwrZJyw.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { n as useConfirm } from "./ConfirmDialog-ClPPfBvs.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { t as Textarea } from "./textarea-kko37XEX.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogFooter, t as Dialog } from "./dialog-CzUx__WV.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { s as STATUS_LABELS } from "./types-0Ylr05H_.js";
import { n as useServiceUsage, t as useCarCustomServices } from "./useCarCustomServices-CJ1Y6woh.js";
import { t as Badge } from "./badge-D1Dupn2y.js";
import { a as CommandItem, c as PopoverContent, i as CommandInput, l as PopoverTrigger, n as CommandEmpty, o as CommandList, r as CommandGroup, s as Popover, t as Command } from "./command-DqQJ5kpE.js";
import { t as effectivePayout } from "./payouts-B1J-S6a6.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, CalendarClock, Car, Check, ChevronsUpDown, ClipboardList, ExternalLink, MessageSquare, Plus, Search, Trash2, User, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
//#region src/components/AppointmentDialog.tsx
var norm = (s) => s.trim().replace(/\s+/g, " ").toLowerCase();
var mapError = humanizeSupabaseError;
function AppointmentDialog({ open, onOpenChange, appointmentId, defaultStart, defaultCarId, defaultServices, defaultBrandId, defaultModelId }) {
	const qc = useQueryClient();
	const confirmAction = useConfirm();
	const isEdit = !!appointmentId;
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
	const { data: services = [] } = useQuery({
		queryKey: ["services"],
		queryFn: listServices
	});
	const { data: brands = [] } = useQuery({
		queryKey: ["brands"],
		queryFn: listBrands
	});
	const { data: allModels = [] } = useQuery({
		queryKey: ["car-models"],
		queryFn: () => listCarModels()
	});
	const { data: existing } = useQuery({
		queryKey: ["appointment", appointmentId],
		queryFn: () => getAppointment(appointmentId),
		enabled: !!appointmentId && open
	});
	const prefillLabel = useMemo(() => {
		if (!defaultBrandId && !defaultModelId) return "";
		return [brands.find((x) => x.id === defaultBrandId)?.name ?? "", allModels.find((x) => x.id === defaultModelId)?.name ?? ""].filter(Boolean).join(" ");
	}, [
		brands,
		allModels,
		defaultBrandId,
		defaultModelId
	]);
	const [clientId, setClientId] = useState("");
	const [carId, setCarId] = useState("");
	const [mechanicId, setMechanicId] = useState("");
	const [startDate, setStartDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [duration, setDuration] = useState(60);
	const [status, setStatus] = useState("scheduled");
	const [mileage, setMileage] = useState("");
	const [comment, setComment] = useState("");
	const [selected, setSelected] = useState([]);
	const [addServiceId, setAddServiceId] = useState("");
	const [reminderOn, setReminderOn] = useState(false);
	const [reminderInterval, setReminderInterval] = useState("half_year");
	const [reminderTitle, setReminderTitle] = useState("");
	const { data: rates = [] } = useQuery({
		queryKey: ["mechanic-service-rates", mechanicId],
		queryFn: () => listMechanicServiceRates(mechanicId),
		enabled: !!mechanicId
	});
	const rateFor = (svc_id, price) => {
		const override = rates.find((r) => r.service_id === svc_id)?.amount;
		if (override != null && override > 0) return Math.round(override);
		return effectivePayout({
			storedPayout: 0,
			price,
			mechanic: mechanics.find((m) => m.id === mechanicId),
			service: services.find((s) => s.id === svc_id)
		});
	};
	useEffect(() => {
		if (!open) return;
		if (existing) {
			setClientId(existing.car?.client_id ?? "");
			setCarId(existing.car_id);
			setMechanicId(existing.mechanic_id ?? "");
			const d = new Date(existing.starts_at);
			setStartDate(format(d, "yyyy-MM-dd"));
			setStartTime(format(d, "HH:mm"));
			setDuration(existing.duration_minutes);
			setStatus(existing.status);
			setMileage(existing.mileage?.toString() ?? "");
			setComment(existing.comment ?? "");
			setSelected(existing.services.map((s) => ({
				service_id: s.service_id,
				price: s.price,
				mechanic_payout: s.mechanic_payout ?? 0
			})));
		} else {
			const d = defaultStart ?? /* @__PURE__ */ new Date();
			let autoCarId = defaultCarId ?? "";
			let autoClientId = "";
			if (!autoCarId && (defaultBrandId || defaultModelId)) {
				const modelName = allModels.find((m) => m.id === defaultModelId)?.name;
				const match = cars.find((c) => (!defaultBrandId || c.brand_id === defaultBrandId) && (!modelName || c.model?.toLowerCase() === modelName.toLowerCase()));
				if (match) {
					autoCarId = match.id;
					autoClientId = match.client_id;
				}
			}
			setClientId(autoClientId);
			setCarId(autoCarId);
			setMechanicId("");
			setStartDate(format(d, "yyyy-MM-dd"));
			setStartTime(format(d, "HH:mm"));
			setDuration(60);
			setStatus("scheduled");
			setMileage("");
			setComment(prefillLabel ? `Из калькулятора: ${prefillLabel}` : "");
			setSelected(defaultServices && defaultServices.length > 0 ? defaultServices.map((s) => ({
				...s,
				mechanic_payout: 0
			})) : []);
		}
		setAddServiceId("");
		setReminderOn(false);
		setReminderInterval("half_year");
		setReminderTitle("");
	}, [
		open,
		existing,
		defaultStart,
		defaultCarId,
		defaultServices,
		defaultBrandId,
		defaultModelId,
		prefillLabel,
		allModels,
		cars
	]);
	const carsForClient = useMemo(() => clientId ? cars.filter((c) => c.client_id === clientId) : cars, [cars, clientId]);
	const selectedCar = useMemo(() => cars.find((c) => c.id === carId), [cars, carId]);
	const selectedBrandName = useMemo(() => brands.find((b) => b.id === selectedCar?.brand_id)?.name ?? "", [brands, selectedCar]);
	const carCustom = useCarCustomServices(selectedBrandName, selectedCar?.model ?? "", selectedCar?.year ?? null);
	const { bump } = useServiceUsage();
	const categories = useMemo(() => Array.from(new Set(services.map((s) => s.category))).sort(), [services]);
	const [customCat, setCustomCat] = useState("");
	const [customCatOther, setCustomCatOther] = useState("");
	const [customName, setCustomName] = useState("");
	const [customPrice, setCustomPrice] = useState("");
	const [savingCustom, setSavingCustom] = useState(false);
	const customCatValue = customCat === "__other__" ? customCatOther : customCat;
	const duplicates = useMemo(() => {
		const name = norm(customName);
		if (name.length < 2) return {
			exact: null,
			similar: []
		};
		const cat = norm(customCatValue);
		const exact = services.find((s) => norm(s.name) === name && (cat ? norm(s.category) === cat : true)) ?? null;
		return {
			exact,
			similar: services.filter((s) => s !== exact).filter((s) => {
				const n = norm(s.name);
				return n.includes(name) || name.includes(n);
			}).slice(0, 5)
		};
	}, [
		customName,
		customCatValue,
		services
	]);
	const addExistingToRecord = (svc, overridePrice) => {
		const price = overridePrice ?? svc.base_price;
		setSelected((prev) => prev.some((s) => s.service_id === svc.id) ? prev : [...prev, {
			service_id: svc.id,
			price,
			mechanic_payout: rateFor(svc.id, price)
		}]);
	};
	const addCustomService = async (opts) => {
		const cat = (customCat === "__other__" ? customCatOther : customCat).trim();
		const name = customName.trim();
		const price = Math.max(0, Math.round(Number(customPrice) || 0));
		if (!cat || !name || price <= 0) {
			toast.error("Заполните категорию, название и цену");
			return;
		}
		setSavingCustom(true);
		try {
			if (opts?.updatePriceOf) {
				const existingSvc = services.find((s) => s.id === opts.updatePriceOf);
				if (existingSvc) {
					await updateService(existingSvc.id, { base_price: price });
					qc.invalidateQueries({ queryKey: ["services"] });
					addExistingToRecord({
						...existingSvc,
						base_price: price
					}, price);
					if (carCustom.enabled) try {
						await carCustom.add({
							category: existingSvc.category,
							name: existingSvc.name,
							price,
							duration_minutes: 30
						});
					} catch (err) {
						console.warn("carCustom.add failed", err);
					}
					setCustomName("");
					setCustomPrice("");
					toast.success("Цена обновлена, услуга добавлена");
					return;
				}
			}
			if (!opts?.force && duplicates.exact) {
				addExistingToRecord(duplicates.exact);
				toast.message("Такая услуга уже есть — добавлена в запись", { description: `${duplicates.exact.category} — ${duplicates.exact.name}` });
				setCustomName("");
				setCustomPrice("");
				return;
			}
			const svc = await upsertServiceByCategoryName({
				category: cat,
				name,
				price
			});
			if (carCustom.enabled) try {
				await carCustom.add({
					category: cat,
					name,
					price,
					duration_minutes: 30
				});
			} catch (err) {
				console.warn("carCustom.add failed", err);
			}
			qc.invalidateQueries({ queryKey: ["services"] });
			setSelected((prev) => prev.some((s) => s.service_id === svc.id) ? prev : [...prev, {
				service_id: svc.id,
				price,
				mechanic_payout: rateFor(svc.id, price)
			}]);
			setCustomName("");
			setCustomPrice("");
			toast.success(carCustom.enabled ? "Услуга добавлена и запомнена для этой машины" : "Услуга добавлена");
		} catch (e) {
			console.error("addCustomService failed", e);
			toast.error(mapError(e));
		} finally {
			setSavingCustom(false);
		}
	};
	const removeSavedCustom = async (id) => {
		if (!await confirmAction({
			title: "Удалить сохранённую услугу?",
			description: "Услуга больше не будет предлагаться для этой машины.",
			destructive: true,
			confirmText: "Удалить"
		})) return;
		try {
			await carCustom.remove(id);
		} catch (e) {
			console.error("removeSavedCustom failed", e);
			toast.error(mapError(e));
		}
	};
	const pickSavedCustom = async (id) => {
		const cs = carCustom.items.find((c) => c.id === id);
		if (!cs) return;
		try {
			const svc = await upsertServiceByCategoryName({
				category: cs.category,
				name: cs.name,
				price: cs.price
			});
			qc.invalidateQueries({ queryKey: ["services"] });
			setSelected((prev) => prev.some((s) => s.service_id === svc.id) ? prev : [...prev, {
				service_id: svc.id,
				price: cs.price,
				mechanic_payout: rateFor(svc.id, cs.price)
			}]);
		} catch (e) {
			console.error("pickSavedCustom failed", e);
			toast.error(mapError(e));
		}
	};
	useEffect(() => {
		if (carId && !clientId) {
			const c = cars.find((x) => x.id === carId);
			if (c) setClientId(c.client_id);
		}
	}, [
		carId,
		clientId,
		cars
	]);
	const prevMechIdRef = useRef("");
	useEffect(() => {
		if (!mechanicId) return;
		const mechChanged = prevMechIdRef.current !== "" && prevMechIdRef.current !== mechanicId;
		prevMechIdRef.current = mechanicId;
		setSelected((prev) => prev.map((s) => mechChanged || !(s.mechanic_payout > 0) ? {
			...s,
			mechanic_payout: rateFor(s.service_id, s.price)
		} : s));
	}, [
		mechanicId,
		rates,
		selected.length
	]);
	const total = selected.reduce((s, x) => s + (x.price || 0), 0);
	const addService = async () => {
		if (!addServiceId) return;
		if (selected.some((s) => s.service_id === addServiceId)) return;
		const svc = services.find((s) => s.id === addServiceId);
		if (!svc) return;
		let price = svc.base_price;
		if (selectedCar?.brand_id) {
			const override = await getPriceForBrand(svc.id, selectedCar.brand_id);
			if (override != null) price = override;
		}
		setSelected((prev) => [...prev, {
			service_id: svc.id,
			price,
			mechanic_payout: rateFor(svc.id, price)
		}]);
		setAddServiceId("");
	};
	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!carId) throw new Error("Выберите машину");
			if (!startDate || !startTime) throw new Error("Укажите дату и время");
			const starts_at = (/* @__PURE__ */ new Date(`${startDate}T${startTime}:00`)).toISOString();
			const servicesPayload = selected.map((s) => mechanicId && !(s.mechanic_payout > 0) ? {
				...s,
				mechanic_payout: rateFor(s.service_id, s.price)
			} : s);
			const payload = {
				car_id: carId,
				mechanic_id: mechanicId || null,
				starts_at,
				duration_minutes: duration,
				status,
				mileage: mileage ? Number(mileage) : null,
				comment: comment || null,
				services: servicesPayload
			};
			if (isEdit) await updateAppointment(appointmentId, payload);
			else await createAppointment(payload);
		},
		onSuccess: () => {
			toast.success(isEdit ? "Запись обновлена" : "Запись создана");
			bump(selected.map((s) => s.service_id).filter(Boolean));
			qc.invalidateQueries({ queryKey: ["appointments"] });
			qc.invalidateQueries({ queryKey: ["client-reminders"] });
			onOpenChange(false);
		},
		onError: (e) => toast.error(e.message)
	});
	const delMutation = useMutation({
		mutationFn: () => deleteAppointment(appointmentId),
		onSuccess: () => {
			toast.success("Запись удалена");
			qc.invalidateQueries({ queryKey: ["appointments"] });
			onOpenChange(false);
		}
	});
	const selectedClient = clients.find((c) => c.id === clientId);
	const subtitleParts = [];
	if (selectedClient) subtitleParts.push(selectedClient.full_name);
	if (selectedCar) {
		const carLbl = [
			selectedBrandName,
			selectedCar.model,
			selectedCar.license_plate
		].filter(Boolean).join(" · ");
		if (carLbl) subtitleParts.push(carLbl);
	}
	const subtitle = subtitleParts.join(" — ");
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "flex h-full max-h-[100dvh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[92vh] sm:rounded-lg",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6",
					children: /* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "min-w-0",
							children: /* @__PURE__ */ jsxs(DialogHeader, {
								className: "space-y-0.5 text-left",
								children: [/* @__PURE__ */ jsx(DialogTitle, {
									className: "truncate text-base sm:text-lg",
									children: isEdit ? "Редактирование записи" : "Новая запись"
								}), subtitle && /* @__PURE__ */ jsx("div", {
									className: "truncate text-xs text-muted-foreground sm:text-sm",
									children: subtitle
								})]
							})
						}), /* @__PURE__ */ jsx(LiveClock, {})]
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex-1 overflow-y-auto px-4 py-4 sm:px-6",
					children: /* @__PURE__ */ jsxs("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ jsx(Section, {
								icon: /* @__PURE__ */ jsx(User, { className: "h-3.5 w-3.5" }),
								title: "Клиент и машина",
								children: /* @__PURE__ */ jsxs("div", {
									className: "grid gap-3 sm:grid-cols-2",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ jsx(Label, { children: "Клиент" }), /* @__PURE__ */ jsxs(Select, {
											value: clientId,
											onValueChange: setClientId,
											children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите клиента" }) }), /* @__PURE__ */ jsx(SelectContent, { children: clients.filter((c) => !c.is_archived).map((c) => /* @__PURE__ */ jsxs(SelectItem, {
												value: c.id,
												children: [c.full_name, c.phone ? ` · ${c.phone}` : ""]
											}, c.id)) })]
										})]
									}), /* @__PURE__ */ jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ jsx(Label, { children: "Машина" }), /* @__PURE__ */ jsxs(Select, {
											value: carId,
											onValueChange: setCarId,
											children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите машину" }) }), /* @__PURE__ */ jsx(SelectContent, { children: carsForClient.map((c) => /* @__PURE__ */ jsx(SelectItem, {
												value: c.id,
												children: /* @__PURE__ */ jsxs("span", {
													className: "inline-flex items-center gap-1.5",
													children: [
														/* @__PURE__ */ jsx(Car, { className: "h-3.5 w-3.5 text-muted-foreground" }),
														c.model,
														c.license_plate ? ` · ${c.license_plate}` : ""
													]
												})
											}, c.id)) })]
										})]
									})]
								})
							}),
							/* @__PURE__ */ jsx(Section, {
								icon: /* @__PURE__ */ jsx(CalendarClock, { className: "h-3.5 w-3.5" }),
								title: "Когда",
								children: /* @__PURE__ */ jsxs("div", {
									className: "grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)]",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ jsx(Label, { children: "Дата" }), /* @__PURE__ */ jsx(Input, {
												type: "date",
												value: startDate,
												onChange: (e) => setStartDate(e.target.value)
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ jsx(Label, { children: "Время" }), /* @__PURE__ */ jsx(Input, {
												type: "time",
												value: startTime,
												onChange: (e) => setStartTime(e.target.value)
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ jsx(Label, { children: "Длит., мин" }), /* @__PURE__ */ jsx(Input, {
												type: "number",
												inputMode: "numeric",
												value: duration,
												onChange: (e) => setDuration(Number(e.target.value))
											})]
										})
									]
								})
							}),
							/* @__PURE__ */ jsx(Section, {
								icon: /* @__PURE__ */ jsx(Wrench, { className: "h-3.5 w-3.5" }),
								title: "Исполнение",
								children: /* @__PURE__ */ jsxs("div", {
									className: "grid gap-3 sm:grid-cols-3",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ jsx(Label, { children: "Мастер" }), /* @__PURE__ */ jsxs(Select, {
												value: mechanicId,
												onValueChange: setMechanicId,
												children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Не назначен" }) }), /* @__PURE__ */ jsx(SelectContent, { children: mechanics.map((m) => /* @__PURE__ */ jsx(SelectItem, {
													value: m.id,
													children: m.full_name
												}, m.id)) })]
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ jsx(Label, { children: "Статус" }), /* @__PURE__ */ jsxs(Select, {
												value: status,
												onValueChange: (v) => setStatus(v),
												children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }), /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(STATUS_LABELS).map(([k, v]) => /* @__PURE__ */ jsx(SelectItem, {
													value: k,
													children: v
												}, k)) })]
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ jsx(Label, { children: "Пробег, км" }), /* @__PURE__ */ jsx(Input, {
												type: "number",
												inputMode: "numeric",
												value: mileage,
												onChange: (e) => setMileage(e.target.value),
												placeholder: "—"
											})]
										})
									]
								})
							}),
							/* @__PURE__ */ jsxs(Section, {
								icon: /* @__PURE__ */ jsx(ClipboardList, { className: "h-3.5 w-3.5" }),
								title: "Услуги",
								action: /* @__PURE__ */ jsx(Button, {
									type: "button",
									size: "sm",
									variant: "outline",
									asChild: true,
									disabled: !carId,
									title: carId ? "Открыть калькулятор в новой вкладке" : "Сначала выберите машину",
									className: "h-8",
									children: carId ? /* @__PURE__ */ jsxs(Link, {
										to: "/calculator",
										search: { carId },
										target: "_blank",
										rel: "noopener",
										children: [
											/* @__PURE__ */ jsx(Calculator, { className: "mr-1.5 h-3.5 w-3.5" }),
											/* @__PURE__ */ jsx("span", {
												className: "hidden sm:inline",
												children: "Калькулятор"
											}),
											/* @__PURE__ */ jsx("span", {
												className: "sm:hidden",
												children: "Калькул."
											}),
											/* @__PURE__ */ jsx(ExternalLink, { className: "ml-1 h-3 w-3 opacity-60" })
										]
									}) : /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx(Calculator, { className: "mr-1.5 h-3.5 w-3.5" }), "Калькулятор"] })
								}),
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ jsx(ServicePicker, {
											services: services.filter((s) => !selected.some((x) => x.service_id === s.id)),
											value: addServiceId,
											onChange: setAddServiceId
										}), /* @__PURE__ */ jsx(Button, {
											type: "button",
											onClick: addService,
											disabled: !addServiceId,
											className: "shrink-0",
											children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
										})]
									}),
									carCustom.enabled && carCustom.items.length > 0 && /* @__PURE__ */ jsxs("div", {
										className: "mt-3 rounded-md border bg-muted/30 p-2",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "mb-1.5 text-xs font-medium text-muted-foreground",
											children: [
												"Сохранённые для ",
												selectedBrandName,
												" ",
												selectedCar?.model,
												" · ",
												selectedCar?.year
											]
										}), /* @__PURE__ */ jsx("div", {
											className: "flex flex-wrap gap-1.5",
											children: carCustom.items.map((c) => /* @__PURE__ */ jsxs("div", {
												className: "inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs",
												children: [/* @__PURE__ */ jsxs("button", {
													type: "button",
													className: "hover:text-primary",
													onClick: () => pickSavedCustom(c.id),
													title: "Добавить в запись",
													children: [
														c.category,
														" — ",
														c.name,
														" · ",
														c.price,
														" ₽"
													]
												}), /* @__PURE__ */ jsx("button", {
													type: "button",
													className: "text-muted-foreground hover:text-destructive",
													onClick: () => removeSavedCustom(c.id),
													title: "Удалить сохранённую",
													children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
												})]
											}, c.id))
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-3 rounded-md border border-dashed p-3",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "mb-2 text-xs font-medium text-muted-foreground",
												children: ["Добавить свою услугу", !carCustom.enabled && " (без сохранения для машины — выберите машину с годом, чтобы запомнить)"]
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_auto]",
												children: [
													/* @__PURE__ */ jsxs(Select, {
														value: customCat,
														onValueChange: setCustomCat,
														children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Категория" }) }), /* @__PURE__ */ jsxs(SelectContent, { children: [categories.map((c) => /* @__PURE__ */ jsx(SelectItem, {
															value: c,
															children: c
														}, c)), /* @__PURE__ */ jsx(SelectItem, {
															value: "__other__",
															children: "Другое…"
														})] })]
													}),
													customCat === "__other__" ? /* @__PURE__ */ jsx(Input, {
														placeholder: "Новая категория",
														value: customCatOther,
														onChange: (e) => setCustomCatOther(e.target.value)
													}) : /* @__PURE__ */ jsx(Input, {
														placeholder: "Название услуги",
														value: customName,
														onChange: (e) => setCustomName(e.target.value)
													}),
													/* @__PURE__ */ jsx(Input, {
														type: "number",
														inputMode: "numeric",
														placeholder: "Цена ₽",
														value: customPrice,
														onChange: (e) => setCustomPrice(e.target.value)
													}),
													/* @__PURE__ */ jsxs(Button, {
														type: "button",
														onClick: () => addCustomService(),
														disabled: savingCustom,
														children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), "Добавить"]
													})
												]
											}),
											customCat === "__other__" && /* @__PURE__ */ jsx("div", {
												className: "mt-2",
												children: /* @__PURE__ */ jsx(Input, {
													placeholder: "Название услуги",
													value: customName,
													onChange: (e) => setCustomName(e.target.value)
												})
											}),
											duplicates.exact && /* @__PURE__ */ jsxs("div", {
												className: "mt-3 rounded-md border border-amber-400/60 bg-amber-50 p-2 text-xs dark:bg-amber-950/30",
												children: [
													/* @__PURE__ */ jsx("div", {
														className: "mb-1.5 font-medium text-amber-900 dark:text-amber-200",
														children: "Такая услуга уже есть в справочнике"
													}),
													/* @__PURE__ */ jsxs("div", {
														className: "mb-2 text-muted-foreground",
														children: [
															duplicates.exact.category,
															" — ",
															duplicates.exact.name,
															" · ",
															duplicates.exact.base_price,
															" ₽"
														]
													}),
													/* @__PURE__ */ jsxs("div", {
														className: "flex flex-wrap gap-2",
														children: [/* @__PURE__ */ jsxs(Button, {
															type: "button",
															size: "sm",
															variant: "secondary",
															disabled: savingCustom,
															onClick: () => {
																addExistingToRecord(duplicates.exact);
																toast.success("Добавлено в запись");
																setCustomName("");
																setCustomPrice("");
															},
															children: [/* @__PURE__ */ jsx(Check, { className: "mr-1 h-3.5 w-3.5" }), "Добавить в запись"]
														}), Number(customPrice) > 0 && Number(customPrice) !== duplicates.exact.base_price && /* @__PURE__ */ jsxs(Button, {
															type: "button",
															size: "sm",
															disabled: savingCustom,
															onClick: () => addCustomService({ updatePriceOf: duplicates.exact.id }),
															children: [
																"Обновить цену на ",
																Number(customPrice),
																" ₽ и добавить"
															]
														})]
													})
												]
											}),
											!duplicates.exact && duplicates.similar.length > 0 && /* @__PURE__ */ jsxs("div", {
												className: "mt-3 rounded-md border bg-muted/30 p-2 text-xs",
												children: [/* @__PURE__ */ jsxs("div", {
													className: "mb-1.5 flex items-center gap-1 font-medium text-muted-foreground",
													children: [/* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5" }), "Похоже, есть уже такие:"]
												}), /* @__PURE__ */ jsx("div", {
													className: "flex flex-wrap gap-1.5",
													children: duplicates.similar.map((s) => /* @__PURE__ */ jsxs("button", {
														type: "button",
														className: "inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 hover:border-primary hover:text-primary",
														onClick: () => {
															addExistingToRecord(s);
															toast.success("Добавлено в запись");
															setCustomName("");
															setCustomPrice("");
														},
														children: [
															s.category,
															" — ",
															s.name,
															" · ",
															s.base_price,
															" ₽"
														]
													}, s.id))
												})]
											})
										]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-3 space-y-2",
										children: [selected.length === 0 && /* @__PURE__ */ jsx("div", {
											className: "rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground",
											children: "Нет добавленных услуг"
										}), selected.map((row) => {
											const svc = services.find((s) => s.id === row.service_id);
											return /* @__PURE__ */ jsxs("div", {
												className: "rounded-md border bg-background p-2",
												children: [/* @__PURE__ */ jsxs("div", {
													className: "flex items-start gap-2",
													children: [/* @__PURE__ */ jsxs("div", {
														className: "min-w-0 flex-1",
														children: [/* @__PURE__ */ jsx("div", {
															className: "truncate text-sm font-medium",
															children: svc?.name
														}), /* @__PURE__ */ jsx("div", {
															className: "truncate text-xs text-muted-foreground",
															children: svc?.category
														})]
													}), /* @__PURE__ */ jsx(Button, {
														size: "icon",
														variant: "ghost",
														type: "button",
														className: "h-7 w-7 shrink-0",
														onClick: () => setSelected((prev) => prev.filter((x) => x.service_id !== row.service_id)),
														children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
													})]
												}), /* @__PURE__ */ jsxs("div", {
													className: "mt-2 grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-3",
													children: [/* @__PURE__ */ jsxs("div", {
														className: "flex items-center gap-1",
														children: [
															/* @__PURE__ */ jsx("span", {
																className: "text-muted-foreground",
																children: "Клиенту:"
															}),
															/* @__PURE__ */ jsx(Input, {
																type: "number",
																className: "h-8 w-24",
																value: row.price,
																onChange: (e) => {
																	const p = Number(e.target.value);
																	setSelected((prev) => prev.map((x) => x.service_id === row.service_id ? {
																		...x,
																		price: p,
																		mechanic_payout: rateFor(x.service_id, p)
																	} : x));
																}
															}),
															/* @__PURE__ */ jsx("span", { children: "₽" })
														]
													}), /* @__PURE__ */ jsxs("div", {
														className: "flex items-center gap-1",
														children: [
															/* @__PURE__ */ jsx("span", {
																className: "text-muted-foreground",
																children: "Мастеру:"
															}),
															/* @__PURE__ */ jsx(Input, {
																type: "number",
																className: "h-8 w-24",
																value: row.mechanic_payout,
																disabled: !mechanicId,
																onChange: (e) => {
																	const p = Number(e.target.value);
																	setSelected((prev) => prev.map((x) => x.service_id === row.service_id ? {
																		...x,
																		mechanic_payout: p
																	} : x));
																}
															}),
															/* @__PURE__ */ jsx("span", { children: "₽" })
														]
													})]
												})]
											}, row.service_id);
										})]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-3 flex justify-end",
										children: /* @__PURE__ */ jsxs(Badge, {
											variant: "secondary",
											className: "text-base",
											children: [
												"Итого: ",
												total,
												" ₽"
											]
										})
									})
								]
							}),
							isEdit && appointmentId && /* @__PURE__ */ jsx(PaymentsSection, {
								appointmentId,
								total
							}),
							/* @__PURE__ */ jsx(Section, {
								icon: /* @__PURE__ */ jsx(MessageSquare, { className: "h-3.5 w-3.5" }),
								title: "Комментарий",
								children: /* @__PURE__ */ jsx(Textarea, {
									value: comment,
									onChange: (e) => setComment(e.target.value),
									rows: 3
								})
							})
						]
					})
				}),
				/* @__PURE__ */ jsxs(DialogFooter, {
					className: "sticky bottom-0 z-10 flex flex-row flex-wrap items-center gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:px-6",
					children: [isEdit && /* @__PURE__ */ jsxs(Button, {
						type: "button",
						variant: "destructive",
						size: "sm",
						onClick: async () => {
							if (await confirmAction({
								title: "Удалить запись?",
								description: "Восстановить будет нельзя.",
								destructive: true,
								confirmText: "Удалить"
							})) delMutation.mutate();
						},
						children: [/* @__PURE__ */ jsx(Trash2, { className: "mr-1.5 h-4 w-4" }), /* @__PURE__ */ jsx("span", {
							className: "hidden sm:inline",
							children: "Удалить"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none",
						children: [/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							onClick: () => onOpenChange(false),
							className: "flex-1 sm:flex-none",
							children: "Отмена"
						}), /* @__PURE__ */ jsx(Button, {
							onClick: () => saveMutation.mutate(),
							disabled: saveMutation.isPending,
							className: "flex-1 sm:flex-none",
							children: saveMutation.isPending ? "Сохранение..." : "Сохранить"
						})]
					})]
				})
			]
		})
	});
}
function Section({ icon, title, action, children }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "rounded-lg border bg-card/40 p-3 sm:p-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-3 flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
				children: [icon, /* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: title
				})]
			}), action && /* @__PURE__ */ jsx("div", {
				className: "shrink-0",
				children: action
			})]
		}), children]
	});
}
function LiveClock() {
	const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
	useEffect(() => {
		const id = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => clearInterval(id);
	}, []);
	const timeStr = format(now, "HH:mm:ss");
	const ruDate = `${[
		"вс",
		"пн",
		"вт",
		"ср",
		"чт",
		"пт",
		"сб"
	][now.getDay()]}, ${now.getDate()} ${[
		"янв",
		"фев",
		"мар",
		"апр",
		"май",
		"июн",
		"июл",
		"авг",
		"сен",
		"окт",
		"ноя",
		"дек"
	][now.getMonth()]}`;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col items-end rounded-md border bg-muted/40 px-2.5 py-1 text-right leading-tight",
		children: [/* @__PURE__ */ jsx("div", {
			className: "font-mono text-sm font-semibold tabular-nums text-foreground sm:text-base",
			children: timeStr
		}), /* @__PURE__ */ jsx("div", {
			className: "text-[10px] text-muted-foreground sm:text-xs",
			children: ruDate
		})]
	});
}
function ServicePicker({ services, value, onChange }) {
	const [open, setOpen] = useState(false);
	const grouped = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		for (const s of services) {
			const arr = map.get(s.category) ?? [];
			arr.push(s);
			map.set(s.category, arr);
		}
		return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "ru"));
	}, [services]);
	const selected = services.find((s) => s.id === value);
	return /* @__PURE__ */ jsxs(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs(Button, {
				type: "button",
				variant: "outline",
				role: "combobox",
				"aria-expanded": open,
				className: "flex-1 justify-between font-normal",
				children: [/* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: selected ? `${selected.category} — ${selected.name} · ${selected.base_price} ₽` : "Добавить услугу"
				}), /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })]
			})
		}), /* @__PURE__ */ jsx(PopoverContent, {
			className: "w-[--radix-popover-trigger-width] p-0",
			align: "start",
			children: /* @__PURE__ */ jsxs(Command, {
				filter: (itemValue, search) => {
					if (!search) return 1;
					return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
				},
				children: [/* @__PURE__ */ jsx(CommandInput, { placeholder: "Поиск услуги…" }), /* @__PURE__ */ jsxs(CommandList, {
					className: "max-h-72",
					children: [/* @__PURE__ */ jsx(CommandEmpty, { children: "Ничего не найдено. Добавьте свою услугу ниже." }), grouped.map(([cat, items]) => /* @__PURE__ */ jsx(CommandGroup, {
						heading: cat,
						children: items.map((s) => /* @__PURE__ */ jsxs(CommandItem, {
							value: `${s.category} ${s.name} ${s.base_price}`,
							onSelect: () => {
								onChange(s.id);
								setOpen(false);
							},
							children: [/* @__PURE__ */ jsx("span", {
								className: "flex-1 truncate",
								children: s.name
							}), /* @__PURE__ */ jsxs("span", {
								className: "ml-2 shrink-0 text-xs text-muted-foreground",
								children: [s.base_price, " ₽"]
							})]
						}, s.id))
					}, cat))]
				})]
			})
		})]
	});
}
function PaymentsSection({ appointmentId, total }) {
	const qc = useQueryClient();
	const confirmAction = useConfirm();
	const { data: payments = [], isLoading } = useQuery({
		queryKey: ["appointment-payments", appointmentId],
		queryFn: () => listAppointmentPayments(appointmentId)
	});
	const paid = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
	const due = Math.max(0, total - paid);
	const [paidAt, setPaidAt] = useState(() => format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const invalidate = () => {
		qc.invalidateQueries({ queryKey: ["appointment-payments", appointmentId] });
		qc.invalidateQueries({ queryKey: ["appointment", appointmentId] });
		qc.invalidateQueries({ queryKey: ["appointments"] });
		qc.invalidateQueries({ queryKey: ["payments-range"] });
	};
	const addMut = useMutation({
		mutationFn: () => createAppointmentPayment({
			appointment_id: appointmentId,
			paid_at: paidAt,
			amount: Math.max(0, Math.round(Number(amount) || 0)),
			note: note.trim() || null
		}),
		onSuccess: () => {
			invalidate();
			setAmount("");
			setNote("");
			toast.success("Платёж добавлен");
		},
		onError: (e) => toast.error(mapError(e))
	});
	const delMut = useMutation({
		mutationFn: (id) => deleteAppointmentPayment(id),
		onSuccess: () => {
			invalidate();
			toast.success("Платёж удалён");
		},
		onError: (e) => toast.error(mapError(e))
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-md border p-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-2 flex flex-wrap items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm font-medium",
					children: "Оплаты клиента"
				}), /* @__PURE__ */ jsxs("div", {
					className: "text-xs text-muted-foreground",
					children: [
						"Оплачено ",
						/* @__PURE__ */ jsxs("span", {
							className: "font-medium text-foreground",
							children: [paid, " ₽"]
						}),
						" из ",
						total,
						" ₽ · осталось ",
						/* @__PURE__ */ jsxs("span", {
							className: "font-medium text-foreground",
							children: [due, " ₽"]
						})
					]
				})]
			}),
			isLoading ? /* @__PURE__ */ jsx("div", {
				className: "text-xs text-muted-foreground",
				children: "Загрузка…"
			}) : payments.length === 0 ? /* @__PURE__ */ jsx("div", {
				className: "text-xs text-muted-foreground",
				children: "Платежей пока нет."
			}) : /* @__PURE__ */ jsx("div", {
				className: "space-y-1.5",
				children: payments.map((p) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-2 rounded border bg-background px-2 py-1.5 text-xs",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "font-medium",
							children: [
								format(new Date(p.paid_at), "d MMM yyyy"),
								" · ",
								Number(p.amount),
								" ₽"
							]
						}), p.note && /* @__PURE__ */ jsx("div", {
							className: "truncate text-muted-foreground",
							children: p.note
						})]
					}), /* @__PURE__ */ jsx(Button, {
						type: "button",
						variant: "ghost",
						size: "icon",
						className: "h-7 w-7",
						onClick: async () => {
							if (await confirmAction({
								title: "Удалить платёж?",
								description: `${format(new Date(p.paid_at), "d MMM yyyy")} · ${Number(p.amount)} ₽`,
								destructive: true,
								confirmText: "Удалить"
							})) delMut.mutate(p.id);
						},
						"aria-label": "Удалить платёж",
						children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5 text-red-600" })
					})]
				}, p.id))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 grid grid-cols-[130px_minmax(0,1fr)_auto] items-end gap-2",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						className: "text-xs",
						children: "Дата"
					}), /* @__PURE__ */ jsx(Input, {
						type: "date",
						value: paidAt,
						onChange: (e) => setPaidAt(e.target.value)
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						className: "text-xs",
						children: "Сумма, ₽"
					}), /* @__PURE__ */ jsx(Input, {
						type: "number",
						inputMode: "numeric",
						value: amount,
						onChange: (e) => setAmount(e.target.value),
						placeholder: due > 0 ? String(due) : "0"
					})] }),
					/* @__PURE__ */ jsxs(Button, {
						type: "button",
						onClick: () => addMut.mutate(),
						disabled: addMut.isPending || !amount || Number(amount) <= 0,
						children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 h-4 w-4" }), " Добавить"]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-2",
				children: /* @__PURE__ */ jsx(Input, {
					value: note,
					onChange: (e) => setNote(e.target.value),
					placeholder: "Заметка (необязательно): наличными, перевод…"
				})
			}),
			due > 0 && /* @__PURE__ */ jsx("div", {
				className: "mt-2 flex justify-end",
				children: /* @__PURE__ */ jsxs(Button, {
					type: "button",
					size: "sm",
					variant: "secondary",
					onClick: () => {
						setPaidAt(format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
						setAmount(String(due));
					},
					children: [
						"Заполнить остатком ",
						due,
						" ₽"
					]
				})
			})
		]
	});
}
//#endregion
export { AppointmentDialog as t };
