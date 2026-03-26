export const LOCAL_DEV_SESSION_KEY = "soulscope.devSession";
export const LOCAL_SCAN_KEY = "soulscope.latestScan";
export const LOCAL_SCAN_LIST_KEY = "soulscope.recentScans";

export type LocalDevSession = {
  email: string;
  mode: "local-dev";
};

export function getLocalDevSession(): LocalDevSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_DEV_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalDevSession;
  } catch (error) {
    console.error("Failed to parse local dev session", error);
    return null;
  }
}

export function setLocalDevSession(email: string) {
  if (typeof window === "undefined") return;
  const session: LocalDevSession = { email, mode: "local-dev" };
  window.localStorage.setItem(LOCAL_DEV_SESSION_KEY, JSON.stringify(session));
}

export function clearLocalDevSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_DEV_SESSION_KEY);
}
