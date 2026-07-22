import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
//#region src/routes/calculator.tsx
var $$splitComponentImporter = () => import("./calculator-SloSAfIh.js");
var calculatorSearchSchema = z.object({ carId: fallback(z.string().optional(), void 0) });
var Route = createFileRoute("/calculator")({
	ssr: false,
	validateSearch: zodValidator(calculatorSearchSchema),
	head: () => ({ meta: [
		{ title: "Samson Auto — автосервис · калькулятор стоимости" },
		{
			name: "description",
			content: "Samson Auto — современный автосервис. Онлайн-калькулятор стоимости услуг для любой марки авто, запись в удобное время."
		},
		{
			property: "og:title",
			content: "Samson Auto — автосервис"
		},
		{
			property: "og:description",
			content: "Калькулятор стоимости, полный прайс услуг и онлайн-запись."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
