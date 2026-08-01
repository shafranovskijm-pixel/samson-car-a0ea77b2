import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
//#region src/routes/calendar.tsx
var $$splitComponentImporter = () => import("./calendar-CWnzoONs.js");
var searchSchema = z.object({
	services: fallback(z.string(), "").default(""),
	brand: fallback(z.string(), "").default(""),
	model: fallback(z.string(), "").default(""),
	carId: fallback(z.string(), "").default("")
});
var Route = createFileRoute("/calendar")({
	ssr: false,
	validateSearch: zodValidator(searchSchema),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
