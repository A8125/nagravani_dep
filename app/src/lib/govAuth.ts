export const DEPARTMENT_CREDENTIALS: Record<string, string> = {
  CMC: "CMC2024",
  PWD: "PWD2024",
  CESC: "CESC2024",
  MUDA: "MUDA2024",
  DHO: "DHO2024",
};

export const GOV_DEPARTMENTS = Object.keys(DEPARTMENT_CREDENTIALS);
export const GOV_SESSION_KEY = "nagaravaani_gov_session";

export type GovSession = {
  department: string;
  loggedInAt: string;
};

export function getGovSession(): GovSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(GOV_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GovSession;
    if (!parsed?.department || !parsed?.loggedInAt) return null;
    if (!DEPARTMENT_CREDENTIALS[parsed.department]) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loginDepartment(department: string, employeeKey: string) {
  const expectedKey = DEPARTMENT_CREDENTIALS[department];
  if (!expectedKey || expectedKey !== employeeKey) return false;

  const session: GovSession = {
    department,
    loggedInAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(GOV_SESSION_KEY, JSON.stringify(session));
  return true;
}

export function logoutDepartment() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GOV_SESSION_KEY);
}
