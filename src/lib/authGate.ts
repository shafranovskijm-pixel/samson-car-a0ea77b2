const KEY = "samson-auth-v1";
const CREDS_KEY = "samson-creds-v1";
const ROLE_KEY = "samson-role-v1";
const GYM_CREDS_KEY = "samson-gym-creds-v1";
const DEFAULT_LOGIN = "admin555";
const DEFAULT_PASS = "admin555";
const DEFAULT_GYM_LOGIN = "fitness555";
const DEFAULT_GYM_PASS = "fitness555";

export type AppSection = "auto" | "gym" | "trainer";

const TRAINER_KEY = "samson-trainer-v1";

export type TrainerSession = { id: string; name: string };

export function getTrainerSession(): TrainerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TRAINER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") return parsed;
  } catch {}
  return null;
}

/** Успешный вход тренера: сохраняем сессию и раздел. */
export function loginAsTrainer(session: TrainerSession) {
  try {
    window.localStorage.setItem(KEY, "1");
    window.localStorage.setItem(TRAINER_KEY, JSON.stringify(session));
    window.localStorage.setItem(ROLE_KEY, "trainer");
  } catch {}
}

type Creds = { login: string; password: string };

export function getGymCredentials(): Creds {
  if (typeof window === "undefined") return { login: DEFAULT_GYM_LOGIN, password: DEFAULT_GYM_PASS };
  try {
    const raw = window.localStorage.getItem(GYM_CREDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.login === "string" && typeof parsed.password === "string") {
        return parsed;
      }
    }
  } catch {}
  return { login: DEFAULT_GYM_LOGIN, password: DEFAULT_GYM_PASS };
}

export function getSection(): AppSection {
  if (typeof window === "undefined") return "auto";
  try {
    return window.localStorage.getItem(ROLE_KEY) === "gym" ? "gym" : "auto";
  } catch {
    return "auto";
  }
}

function setSection(section: AppSection) {
  try { window.localStorage.setItem(ROLE_KEY, section); } catch {}
}

/** Вход в выбранный раздел: у зала свой логин/пароль. */
export function loginTo(section: AppSection, username: string, password: string): boolean {
  const u = username.trim().toLowerCase();
  const p = password.trim();
  const creds = section === "gym" ? getGymCredentials() : getCredentials();
  if (u === creds.login.trim().toLowerCase() && p === creds.password) {
    try { window.localStorage.setItem(KEY, "1"); } catch {}
    setSection(section);
    return true;
  }
  return false;
}

export function getCredentials(): Creds {
  if (typeof window === "undefined") return { login: DEFAULT_LOGIN, password: DEFAULT_PASS };
  try {
    const raw = window.localStorage.getItem(CREDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.login === "string" && typeof parsed.password === "string") {
        return parsed;
      }
    }
  } catch {}
  return { login: DEFAULT_LOGIN, password: DEFAULT_PASS };
}

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
  const creds = getCredentials();
  if (u === creds.login.trim().toLowerCase() && p === creds.password) {
    try { window.localStorage.setItem(KEY, "1"); } catch {}
    return true;
  }
  return false;
}

export function logout() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(ROLE_KEY);
  } catch {}
}

export function changeCredentials(
  currentPassword: string,
  newLogin: string,
  newPassword: string,
): { ok: true } | { ok: false; error: string } {
  const creds = getCredentials();
  if (currentPassword.trim() !== creds.password) {
    return { ok: false, error: "Неверный текущий пароль" };
  }
  const nl = newLogin.trim();
  const np = newPassword;
  if (!nl) return { ok: false, error: "Логин не может быть пустым" };
  if (!np || np.length < 4) return { ok: false, error: "Пароль должен быть не короче 4 символов" };
  try {
    window.localStorage.setItem(CREDS_KEY, JSON.stringify({ login: nl, password: np }));
  } catch {
    return { ok: false, error: "Не удалось сохранить" };
  }
  return { ok: true };
}
