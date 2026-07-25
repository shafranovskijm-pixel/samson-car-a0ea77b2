import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/routes/settings.tsx
var $$splitComponentImporter = () => import("./settings-CVjh5xy0.js");
var Route = createFileRoute("/settings")({
	ssr: false,
	validateSearch: (input) => ({ tab: typeof input.tab === "string" ? input.tab : "brands" }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
