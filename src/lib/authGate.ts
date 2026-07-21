const KEY = "samson-auth-v1";
const LOGIN = "admin555";
const PASS = "admin555";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function login(username: string, password: string): boolean {
  const u = username.trim().toLowerCase();
  const p = password.trim();
  if (u === LOGIN && p === PASS) {
    try { window.localStorage.setItem(KEY, "1"); } catch {}
    return true;
  }
  return false;
}

export function logout() {
  try { window.localStorage.removeItem(KEY); } catch {}
}
