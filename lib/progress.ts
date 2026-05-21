import type { CardState, ExamRun, SectionId } from "./types";
import { ALL_SECTIONS } from "./types";
import { activeKey } from "./profiles";

export type Lang = "et" | "en";

export interface Settings {
  uiLang: Lang;
  sessionSize: number;
  examLength: number;
  examDurationMin: number;
  showUnverified: boolean;
  lastScope: SectionId[];
}

export const DEFAULT_SETTINGS: Settings = {
  uiLang: "et",
  sessionSize: 30,
  examLength: 40,
  examDurationMin: 60,
  showUnverified: true,
  lastScope: [...ALL_SECTIONS],
};

type ProgressMap = Record<string, CardState>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJSON<T>(suffix: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const key = activeKey(suffix);
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(suffix: string, value: unknown): void {
  if (!isBrowser()) return;
  const key = activeKey(suffix);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadProgress(): ProgressMap {
  return readJSON<ProgressMap>("progress.v1", {});
}

export function saveProgress(p: ProgressMap): void {
  writeJSON("progress.v1", p);
}

export function getCardState(qid: string): CardState | null {
  const p = loadProgress();
  return p[qid] ?? null;
}

export function setCardState(qid: string, s: CardState): void {
  const p = loadProgress();
  p[qid] = s;
  saveProgress(p);
}

export function loadSettings(): Settings {
  const raw = readJSON<Partial<Settings>>("settings.v1", {});
  return { ...DEFAULT_SETTINGS, ...raw };
}

export function saveSettings(s: Settings): void {
  writeJSON("settings.v1", s);
}

export function loadExams(): ExamRun[] {
  return readJSON<ExamRun[]>("exams.v1", []);
}

export function pushExam(run: ExamRun): void {
  const list = loadExams();
  list.unshift(run);
  writeJSON("exams.v1", list.slice(0, 50));
}

export function resetAll(): void {
  if (!isBrowser()) return;
  const progressKey = activeKey("progress.v1");
  const examsKey = activeKey("exams.v1");
  if (progressKey) localStorage.removeItem(progressKey);
  if (examsKey) localStorage.removeItem(examsKey);
}

export interface ExportBlob {
  schema: "korda.v1";
  exportedAt: number;
  profile?: string;
  progress: ProgressMap;
  settings: Settings;
  exams: ExamRun[];
}

export function exportAll(profileName?: string): ExportBlob {
  return {
    schema: "korda.v1",
    exportedAt: Date.now(),
    profile: profileName,
    progress: loadProgress(),
    settings: loadSettings(),
    exams: loadExams(),
  };
}

export function importAll(blob: ExportBlob): void {
  if (!isBrowser()) return;
  if (blob?.schema !== "korda.v1") throw new Error("Wrong schema");
  if (blob.progress) writeJSON("progress.v1", blob.progress);
  if (blob.settings) writeJSON("settings.v1", blob.settings);
  if (blob.exams) writeJSON("exams.v1", blob.exams);
}
