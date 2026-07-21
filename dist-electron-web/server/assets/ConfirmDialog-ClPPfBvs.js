import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-D9xGQQQw.js";
import { createContext, useCallback, useContext, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/ConfirmDialog.tsx
var ConfirmCtx = createContext(null);
function ConfirmProvider({ children }) {
	const [state, setState] = useState(null);
	const confirm = useCallback((opts) => {
		return new Promise((resolve) => {
			setState({
				...opts,
				open: true,
				resolve
			});
		});
	}, []);
	const close = (result) => {
		state?.resolve?.(result);
		setState((s) => s ? {
			...s,
			open: false
		} : s);
	};
	return /* @__PURE__ */ jsxs(ConfirmCtx.Provider, {
		value: confirm,
		children: [children, /* @__PURE__ */ jsx(AlertDialog, {
			open: !!state?.open,
			onOpenChange: (o) => {
				if (!o) close(false);
			},
			children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [/* @__PURE__ */ jsxs(AlertDialogHeader, { children: [/* @__PURE__ */ jsx(AlertDialogTitle, { children: state?.title ?? "Подтвердите действие" }), state?.description && /* @__PURE__ */ jsx(AlertDialogDescription, { children: state.description })] }), /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [/* @__PURE__ */ jsx(AlertDialogCancel, {
				onClick: () => close(false),
				children: state?.cancelText ?? "Отмена"
			}), /* @__PURE__ */ jsx(AlertDialogAction, {
				onClick: () => close(true),
				className: state?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : void 0,
				children: state?.confirmText ?? "Подтвердить"
			})] })] })
		})]
	});
}
function useConfirm() {
	const ctx = useContext(ConfirmCtx);
	if (!ctx) return (opts) => Promise.resolve(typeof window !== "undefined" ? window.confirm([opts.title, opts.description].filter(Boolean).join("\n") || "Подтвердите действие") : false);
	return ctx;
}
//#endregion
export { useConfirm as n, ConfirmProvider as t };
