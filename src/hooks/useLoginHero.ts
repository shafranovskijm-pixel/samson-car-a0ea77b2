import { useEffect, useState } from "react";
import defaultHero from "@/assets/samson-auto-hero.jpg";

const KEY = "samson.loginHero";

export function getLoginHero(): string {
  if (typeof window === "undefined") return defaultHero;
  try {
    return localStorage.getItem(KEY) || defaultHero;
  } catch {
    return defaultHero;
  }
}

export function setLoginHero(dataUrl: string) {
  localStorage.setItem(KEY, dataUrl);
  window.dispatchEvent(new Event("samson.loginHero.changed"));
}

export function resetLoginHero() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("samson.loginHero.changed"));
}

export const DEFAULT_LOGIN_HERO = defaultHero;

export function useLoginHero(): string {
  const [src, setSrc] = useState<string>(() => getLoginHero());
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
