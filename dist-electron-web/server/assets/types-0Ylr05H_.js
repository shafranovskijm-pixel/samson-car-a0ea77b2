//#region src/lib/types.ts
var TIER_COEFFICIENT = {
	economy: 1,
	comfort: 1.3,
	business: 1.7,
	premium: 2.2,
	luxury: 3
};
var TIER_LABEL = {
	economy: "Эконом",
	comfort: "Комфорт",
	business: "Бизнес",
	premium: "Премиум",
	luxury: "Люкс"
};
var TIER_OPTIONS = [
	"economy",
	"comfort",
	"business",
	"premium",
	"luxury"
];
var resolveTier = (brand, model) => {
	const raw = model?.tier ?? brand?.tier ?? "economy";
	return raw in TIER_COEFFICIENT ? raw : "economy";
};
var CLIENT_CATEGORY_ORDER = [
	"regular",
	"vip",
	"new",
	"problem",
	"corporate",
	"friend"
];
var CLIENT_CATEGORY_LABELS = {
	regular: "Обычный",
	vip: "VIP",
	new: "Новый",
	problem: "Проблемный",
	corporate: "Корпоративный",
	friend: "Друг / знакомый"
};
var CLIENT_CATEGORY_COLORS = {
	regular: "bg-slate-500",
	vip: "bg-amber-500",
	new: "bg-emerald-500",
	problem: "bg-red-500",
	corporate: "bg-blue-600",
	friend: "bg-pink-500"
};
var STATUS_LABELS = {
	scheduled: "Запланировано",
	in_progress: "В работе",
	done: "Выполнено",
	cancelled: "Отменено"
};
var STATUS_COLORS = {
	scheduled: "bg-blue-100 text-blue-800 border-blue-300",
	in_progress: "bg-amber-100 text-amber-800 border-amber-300",
	done: "bg-green-100 text-green-800 border-green-300",
	cancelled: "bg-gray-100 text-gray-600 border-gray-300"
};
var PAYMENT_LABELS = {
	paid: "Оплачено",
	prepaid: "Предоплата",
	partial: "Частично",
	unpaid: "Не оплачен"
};
var PAYMENT_COLORS = {
	paid: "bg-green-100 text-green-800 border-green-300",
	prepaid: "bg-amber-100 text-amber-800 border-amber-300",
	partial: "bg-amber-100 text-amber-800 border-amber-300",
	unpaid: "bg-red-100 text-red-800 border-red-300"
};
//#endregion
export { PAYMENT_LABELS as a, TIER_COEFFICIENT as c, resolveTier as d, PAYMENT_COLORS as i, TIER_LABEL as l, CLIENT_CATEGORY_LABELS as n, STATUS_COLORS as o, CLIENT_CATEGORY_ORDER as r, STATUS_LABELS as s, CLIENT_CATEGORY_COLORS as t, TIER_OPTIONS as u };
