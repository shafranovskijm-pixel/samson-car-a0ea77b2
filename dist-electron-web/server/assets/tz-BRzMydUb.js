//#region src/lib/tz.ts
var OFFSET_MIN = 600;
function ussDateISO(d = /* @__PURE__ */ new Date()) {
	return new Date(d.getTime() + OFFSET_MIN * 6e4).toISOString().slice(0, 10);
}
function ussTimeHM(d = /* @__PURE__ */ new Date()) {
	return new Date(d.getTime() + OFFSET_MIN * 6e4).toISOString().slice(11, 16);
}
function ussLocalToInstant(dateStr, timeStr) {
	const iso = `${dateStr}T${timeStr}:00+10:00`;
	return new Date(iso);
}
function isSameUssDay(a, b) {
	return ussDateISO(a) === ussDateISO(b);
}
function isTodayUss(d) {
	return isSameUssDay(d, /* @__PURE__ */ new Date());
}
function isTomorrowUss(d) {
	return isSameUssDay(d, new Date(Date.now() + 1440 * 6e4));
}
function isYesterdayUss(d) {
	return isSameUssDay(d, /* @__PURE__ */ new Date(Date.now() - 1440 * 6e4));
}
function ussDayKey(d) {
	return ussDateISO(d);
}
//#endregion
export { ussDayKey as a, ussDateISO as i, isTomorrowUss as n, ussLocalToInstant as o, isYesterdayUss as r, ussTimeHM as s, isTodayUss as t };
