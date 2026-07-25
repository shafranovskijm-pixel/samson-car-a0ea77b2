import { useEffect, useState } from "react";
//#region src/assets/samson-auto-hero.jpg
var samson_auto_hero_default = "./assets/samson-auto-hero-DAM8yrTa.jpg";
//#endregion
//#region src/hooks/useLoginHero.ts
var KEY = "samson.loginHero";
function getLoginHero() {
	if (typeof window === "undefined") return samson_auto_hero_default;
	try {
		return localStorage.getItem(KEY) || "./assets/samson-auto-hero-DAM8yrTa.jpg";
	} catch {
		return samson_auto_hero_default;
	}
}
function setLoginHero(dataUrl) {
	localStorage.setItem(KEY, dataUrl);
	window.dispatchEvent(new Event("samson.loginHero.changed"));
}
function resetLoginHero() {
	localStorage.removeItem(KEY);
	window.dispatchEvent(new Event("samson.loginHero.changed"));
}
var DEFAULT_LOGIN_HERO = samson_auto_hero_default;
function useLoginHero() {
	const [src, setSrc] = useState(() => getLoginHero());
	useEffect(() => {
		const upd = () => setSrc(getLoginHero());
		window.addEventListener("storage", upd);
		window.addEventListener("samson.loginHero.changed", upd);
		return () => {
			window.removeEventListener("storage", upd);
			window.removeEventListener("samson.loginHero.changed", upd);
		};
	}, []);
	return src;
}
//#endregion
export { useLoginHero as i, resetLoginHero as n, setLoginHero as r, DEFAULT_LOGIN_HERO as t };
