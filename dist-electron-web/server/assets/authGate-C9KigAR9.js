//#region src/lib/authGate.ts
var KEY = "samson-auth-v1";
var LOGIN = "admin555";
var PASS = "admin555";
function isLoggedIn() {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(KEY) === "1";
	} catch {
		return false;
	}
}
function login(username, password) {
	const u = username.trim().toLowerCase();
	const p = password.trim();
	if (u === LOGIN && p === PASS) {
		try {
			window.localStorage.setItem(KEY, "1");
		} catch {}
		return true;
	}
	return false;
}
function logout() {
	try {
		window.localStorage.removeItem(KEY);
	} catch {}
}
//#endregion
export { login as n, logout as r, isLoggedIn as t };
