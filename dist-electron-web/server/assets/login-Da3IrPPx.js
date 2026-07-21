import { n as Button, t as Input } from "./input-CEMa6_Eh.js";
import { n as login, t as isLoggedIn } from "./authGate-C9KigAR9.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-BXjpJ96D.js";
import { t as Label } from "./label-DBD1bRRP.js";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
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
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background p-4",
		children: /* @__PURE__ */ jsxs(Card, {
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
		})
	});
}
//#endregion
export { LoginPage as component };
