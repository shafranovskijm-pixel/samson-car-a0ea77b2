import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { i as login, r as isLoggedIn } from "./authGate-Bd0wCx6i.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-BXjpJ96D.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { Download } from "lucide-react";
var SamsonCRM_windows_zip_asset_default = {
	version: 1,
	asset_id: "4966b9bd-e05c-4cd4-8661-a02dc8570a0a",
	project_id: "ddf217c8-3d5f-4fe6-9180-c8a9b5a16136",
	url: "/__l5e/assets-v1/4966b9bd-e05c-4cd4-8661-a02dc8570a0a/SamsonCRM-windows.zip",
	r2_key: "a/v1/ddf217c8-3d5f-4fe6-9180-c8a9b5a16136/4966b9bd-e05c-4cd4-8661-a02dc8570a0a/SamsonCRM-windows.zip",
	original_filename: "SamsonCRM-windows.zip",
	size: 152667560,
	content_type: "application/zip",
	created_at: "2026-07-22T07:05:02Z"
};
//#endregion
//#region src/routes/login.tsx?tsr-split=component
function LoginPage() {
	const navigate = useNavigate();
	const [u, setU] = useState("");
	const [p, setP] = useState("");
	const [err, setErr] = useState(null);
	useEffect(() => {
		if (isLoggedIn()) navigate({ to: "/" });
	}, [navigate]);
	function onSubmit(e) {
		e.preventDefault();
		if (login(u, p)) navigate({ to: "/" });
		else setErr("Неверный логин или пароль");
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-screen items-center justify-center bg-background p-4",
		children: [/* @__PURE__ */ jsxs(Card, {
			className: "w-full max-w-sm",
			children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Samson Auto — вход" }) }), /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", {
				onSubmit,
				className: "space-y-3",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "u",
						children: "Логин"
					}), /* @__PURE__ */ jsx(Input, {
						id: "u",
						autoFocus: true,
						value: u,
						onChange: (e) => setU(e.target.value),
						autoComplete: "username"
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "p",
						children: "Пароль"
					}), /* @__PURE__ */ jsx(Input, {
						id: "p",
						type: "password",
						value: p,
						onChange: (e) => setP(e.target.value),
						autoComplete: "current-password"
					})] }),
					err && /* @__PURE__ */ jsx("p", {
						className: "text-sm text-destructive",
						children: err
					}),
					/* @__PURE__ */ jsx(Button, {
						type: "submit",
						className: "w-full",
						children: "Войти"
					})
				]
			}) })]
		}), /* @__PURE__ */ jsxs("a", {
			href: SamsonCRM_windows_zip_asset_default.url,
			download: "SamsonCRM-windows.zip",
			className: "mt-4 flex w-full max-w-sm items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm transition hover:bg-accent",
			children: [/* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }), /* @__PURE__ */ jsxs("div", {
				className: "text-left",
				children: [/* @__PURE__ */ jsx("div", {
					className: "font-medium",
					children: "Скачать для Windows (оффлайн)"
				}), /* @__PURE__ */ jsx("div", {
					className: "text-xs text-muted-foreground",
					children: "ZIP ~146 МБ · распакуйте и запустите SamsonCRM.exe · логин тот же"
				})]
			})]
		})]
	});
}
//#endregion
export { LoginPage as component };
