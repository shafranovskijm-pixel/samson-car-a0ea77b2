function effectivePercent(mechanic, service) {
	const mp = Number(mechanic?.default_payout_percent);
	if (Number.isFinite(mp) && mp > 0) return mp;
	const sp = Number(service?.default_payout_percent);
	if (Number.isFinite(sp) && sp > 0) return sp;
	return 50;
}
function effectivePayout(params) {
	const stored = Number(params.storedPayout ?? 0);
	if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
	const price = Number(params.price ?? 0) || 0;
	const pct = effectivePercent(params.mechanic, params.service);
	return Math.round(price * pct / 100);
}
//#endregion
export { effectivePayout as t };
