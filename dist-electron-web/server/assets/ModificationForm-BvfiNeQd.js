import { A as humanizeSupabaseError } from "./api-BaCLxPcN.js";
import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { t as Checkbox } from "./checkbox-kt6FvQcE.js";
import { t as dbAddModification } from "./carsCatalogDb-0r0YjLSx.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/components/ModificationForm.tsx
var empty = {
	body_code: "",
	engine_code: "",
	displacement_cc: "",
	horsepower: "",
	fuel: "",
	hybrid: false,
	steering: "",
	note: ""
};
function ModificationForm({ brand, modelName, year, onCancel, onSaved, compact = false }) {
	const [form, setForm] = useState(empty);
	const [saving, setSaving] = useState(false);
	const submit = async () => {
		setSaving(true);
		try {
			await dbAddModification({
				brand,
				modelName,
				year,
				body_code: form.body_code.trim() || null,
				engine_code: form.engine_code.trim() || null,
				displacement_cc: form.displacement_cc ? Number(form.displacement_cc) : null,
				horsepower: form.horsepower ? Number(form.horsepower) : null,
				fuel: form.fuel.trim() || null,
				hybrid: form.hybrid,
				steering: form.steering.trim() || null,
				note: form.note.trim() || null
			});
			toast.success("Модификация добавлена");
			setForm(empty);
			onSaved?.();
		} catch (e) {
			toast.error(humanizeSupabaseError(e));
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: compact ? "" : "rounded-xl border bg-card p-3",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-2 text-sm font-medium text-muted-foreground",
				children: [
					brand,
					" ",
					modelName,
					" · ",
					year
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ jsx(Input, {
						placeholder: "Кузов (SXV20)",
						value: form.body_code,
						onChange: (e) => setForm({
							...form,
							body_code: e.target.value
						})
					}),
					/* @__PURE__ */ jsx(Input, {
						placeholder: "Код двигателя (5S-FE)",
						value: form.engine_code,
						onChange: (e) => setForm({
							...form,
							engine_code: e.target.value
						})
					}),
					/* @__PURE__ */ jsx(Input, {
						placeholder: "Объём, см³ (2200)",
						inputMode: "numeric",
						value: form.displacement_cc,
						onChange: (e) => setForm({
							...form,
							displacement_cc: e.target.value.replace(/\D/g, "")
						})
					}),
					/* @__PURE__ */ jsx(Input, {
						placeholder: "Мощность, л.с. (135)",
						inputMode: "numeric",
						value: form.horsepower,
						onChange: (e) => setForm({
							...form,
							horsepower: e.target.value.replace(/\D/g, "")
						})
					}),
					/* @__PURE__ */ jsx(Input, {
						placeholder: "Топливо (бензин / дизель)",
						value: form.fuel,
						onChange: (e) => setForm({
							...form,
							fuel: e.target.value
						})
					}),
					/* @__PURE__ */ jsx(Input, {
						placeholder: "Руль (левый / правый)",
						value: form.steering,
						onChange: (e) => setForm({
							...form,
							steering: e.target.value
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 px-1",
						children: [/* @__PURE__ */ jsx(Checkbox, {
							id: "mod-hybrid",
							checked: form.hybrid,
							onCheckedChange: (v) => setForm({
								...form,
								hybrid: !!v
							})
						}), /* @__PURE__ */ jsx(Label, {
							htmlFor: "mod-hybrid",
							className: "cursor-pointer",
							children: "Гибрид"
						})]
					}),
					/* @__PURE__ */ jsx(Input, {
						placeholder: "Заметка (опц.)",
						value: form.note,
						onChange: (e) => setForm({
							...form,
							note: e.target.value
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex justify-end gap-2",
				children: [onCancel && /* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "ghost",
					onClick: onCancel,
					children: "Отмена"
				}), /* @__PURE__ */ jsx(Button, {
					type: "button",
					onClick: submit,
					disabled: saving,
					children: saving ? "Сохранение…" : "Сохранить"
				})]
			})
		]
	});
}
//#endregion
export { ModificationForm as t };
