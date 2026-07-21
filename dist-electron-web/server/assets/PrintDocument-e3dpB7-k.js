import { useEffect } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
//#region src/components/PrintDocument.tsx
var fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";
function PrintDocument(props) {
	useEffect(() => {
		const onAfter = () => props.onDone();
		window.addEventListener("afterprint", onAfter);
		const t = window.setTimeout(() => {
			try {
				window.print();
			} catch {
				props.onDone();
			}
		}, 80);
		return () => {
			window.removeEventListener("afterprint", onAfter);
			window.clearTimeout(t);
		};
	}, []);
	if (typeof document === "undefined") return null;
	return createPortal(/* @__PURE__ */ jsxs("div", {
		id: "print-root",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "print-header",
				children: [/* @__PURE__ */ jsx("div", {
					className: "print-brand",
					children: "Автосервис «Самсон»"
				}), /* @__PURE__ */ jsx("div", {
					className: "print-title",
					children: props.title
				})]
			}),
			props.meta.length > 0 && /* @__PURE__ */ jsx("div", {
				className: "print-meta",
				children: props.meta.map((m, i) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", {
					style: { color: "#555" },
					children: [m.label, ": "]
				}), /* @__PURE__ */ jsx("b", { children: m.value || "—" })] }, i))
			}),
			props.sections?.map((s, i) => /* @__PURE__ */ jsxs("div", {
				className: "print-section",
				children: [/* @__PURE__ */ jsx("h3", { children: s.title }), /* @__PURE__ */ jsx("table", {
					className: "print-kv",
					children: /* @__PURE__ */ jsx("tbody", { children: s.rows.map((r, j) => /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("td", {
						className: "k",
						children: r.label
					}), /* @__PURE__ */ jsx("td", { children: r.value || "—" })] }, j)) })
				})]
			}, i)),
			/* @__PURE__ */ jsxs("div", {
				className: "print-section",
				children: [/* @__PURE__ */ jsx("h3", { children: "Работы" }), /* @__PURE__ */ jsxs("table", {
					className: "print-works",
					children: [
						/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("th", {
								style: { width: "6%" },
								children: "№"
							}),
							/* @__PURE__ */ jsx("th", { children: "Наименование" }),
							/* @__PURE__ */ jsx("th", {
								style: {
									width: "22%",
									textAlign: "right"
								},
								children: "Стоимость"
							})
						] }) }),
						/* @__PURE__ */ jsx("tbody", { children: props.works.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
							colSpan: 3,
							style: {
								textAlign: "center",
								color: "#666"
							},
							children: "Нет работ"
						}) }) : props.works.map((w, i) => /* @__PURE__ */ jsxs("tr", { children: [
							/* @__PURE__ */ jsx("td", { children: i + 1 }),
							/* @__PURE__ */ jsx("td", { children: w.name }),
							/* @__PURE__ */ jsx("td", {
								style: { textAlign: "right" },
								children: fmt(w.price)
							})
						] }, i)) }),
						/* @__PURE__ */ jsxs("tfoot", { children: [/* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsxs("td", {
							colSpan: 2,
							style: {
								textAlign: "right",
								fontWeight: "bold"
							},
							children: [props.totalLabel ?? "Итого", ":"]
						}), /* @__PURE__ */ jsx("td", {
							style: {
								textAlign: "right",
								fontWeight: "bold"
							},
							children: fmt(props.total)
						})] }), props.footer?.map((f, i) => /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsxs("td", {
							colSpan: 2,
							style: { textAlign: "right" },
							children: [f.label, ":"]
						}), /* @__PURE__ */ jsx("td", {
							style: { textAlign: "right" },
							children: f.value
						})] }, i))] })
					]
				})]
			}),
			props.signatures && /* @__PURE__ */ jsxs("div", {
				className: "print-signatures",
				children: [/* @__PURE__ */ jsx("div", { children: "Клиент: ______________________ / ______________" }), /* @__PURE__ */ jsx("div", { children: "Мастер: ______________________ / ______________" })]
			})
		]
	}), document.body);
}
//#endregion
export { PrintDocument as t };
