export interface Profile {
  name: string;
  createdAt: number;
  lastSeen: number;
}

const KEY_PROFILES = "korda.profiles.v1";
const KEY_ACTIVE = "korda.active.v1";

const LEGACY_KEYS = ["korda.progress.v1", "korda.settings.v1", "korda.exams.v1"];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function listProfiles(): Profile[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY_PROFILES);
    return raw ? (JSON.parse(raw) as Profile[]) : [];
  } catch {
    return [];
  }
}

function saveProfiles(list: Profile[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_PROFILES, JSON.stringify(list));
}

export function getActiveProfileName(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEY_ACTIVE);
}

export function setActiveProfileName(name: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_ACTIVE, name);
  const list = listProfiles();
  const p = list.find((x) => x.name === name);
  if (p) {
    p.lastSeen = Date.now();
    saveProfiles(list);
  }
  window.dispatchEvent(new Event("korda:profile"));
}

export function profileKey(name: string, suffix: string): string {
  return `korda.p.${name}.${suffix}`;
}

export function activeKey(suffix: string): string | null {
  const name = getActiveProfileName();
  if (!name) return null;
  return profileKey(name, suffix);
}

export function createProfile(rawName: string): Profile {
  const name = rawName.trim().slice(0, 40);
  if (!name) throw new Error("Empty name");
  const list = listProfiles();
  if (list.find((p) => p.name === name)) throw new Error("Profile already exists");
  const profile: Profile = { name, createdAt: Date.now(), lastSeen: Date.now() };
  list.push(profile);
  saveProfiles(list);
  setActiveProfileName(name);
  return profile;
}

export function deleteProfile(name: string): void {
  if (!isBrowser()) return;
  const list = listProfiles().filter((p) => p.name !== name);
  saveProfiles(list);
  // Wipe profile-scoped data
  const prefix = `korda.p.${name}.`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) localStorage.removeItem(k);
  }
  if (getActiveProfileName() === name) {
    const remaining = listProfiles();
    if (remaining.length > 0) setActiveProfileName(remaining[0].name);
    else localStorage.removeItem(KEY_ACTIVE);
  }
  window.dispatchEvent(new Event("korda:profile"));
}

/**
 * If legacy global keys exist and no profiles have been created yet,
 * migrate to a "Guest" profile so existing users don't lose their progress.
 */
export function migrateLegacy(): void {
  if (!isBrowser()) return;
  if (listProfiles().length > 0) return;
  const hasLegacy = LEGACY_KEYS.some((k) => localStorage.getItem(k) != null);
  if (!hasLegacy) return;
  const guest: Profile = { name: "Guest", createdAt: Date.now(), lastSeen: Date.now() };
  saveProfiles([guest]);
  setActiveProfileName("Guest");
  for (const k of LEGACY_KEYS) {
    const v = localStorage.getItem(k);
    if (v == null) continue;
    const suffix = k.replace("korda.", "");
    localStorage.setItem(profileKey("Guest", suffix), v);
    localStorage.removeItem(k);
  }
}
