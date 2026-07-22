//#region src/lib/authGate.ts
var KEY = "samson-auth-v1";
var CREDS_KEY = "samson-creds-v1";
var DEFAULT_LOGIN = "admin555";
var DEFAULT_PASS = "admin555";
function getCredentials() {
	if (typeof window === "undefined") return {
		login: DEFAULT_LOGIN,
		password: DEFAULT_PASS
	};
	try {
		const raw = window.localStorage.getItem(CREDS_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed.login === "string" && typeof parsed.password === "string") return parsed;
		}
	} catch {}
	return {
		login: DEFAULT_LOGIN,
		password: DEFAULT_PASS
	};
}
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
	const creds = getCredentials();
	if (u === creds.login.trim().toLowerCase() && p === creds.password) {
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
function changeCredentials(currentPassword, newLogin, newPassword) {
	const creds = getCredentials();
	if (currentPassword.trim() !== creds.password) return {
		ok: false,
		error: "Неверный текущий пароль"
	};
	const nl = newLogin.trim();
	const np = newPassword;
	if (!nl) return {
		ok: false,
		error: "Логин не может быть пустым"
	};
	if (!np || np.length < 4) return {
		ok: false,
		error: "Пароль должен быть не короче 4 символов"
	};
	try {
		window.localStorage.setItem(CREDS_KEY, JSON.stringify({
			login: nl,
			password: np
		}));
	} catch {
		return {
			ok: false,
			error: "Не удалось сохранить"
		};
	}
	return { ok: true };
}
//#endregion
export { logout as a, login as i, getCredentials as n, isLoggedIn as r, changeCredentials as t };
