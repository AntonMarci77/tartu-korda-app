import type { SectionId } from "./types";
import { ALL_SECTIONS } from "./types";
import { loadSettings, saveSettings } from "./progress";

export function getActiveScope(): SectionId[] {
  const s = loadSettings();
  if (!s.lastScope || s.lastScope.length === 0) return [...ALL_SECTIONS];
  return s.lastScope;
}

export function setActiveScope(scope: SectionId[]): void {
  const s = loadSettings();
  saveSettings({ ...s, lastScope: scope.length ? scope : [...ALL_SECTIONS] });
}

export function isAllScope(scope: SectionId[]): boolean {
  return scope.length === ALL_SECTIONS.length;
}
