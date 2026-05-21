"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  createProfile,
  getActiveProfileName,
  listProfiles,
  migrateLegacy,
  setActiveProfileName,
} from "@/lib/profiles";
import { loadSettings } from "@/lib/progress";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/progress";

/**
 * On first paint: run the legacy migration, then if no active profile exists,
 * show a full-screen modal that lets the visitor pick or create one.
 * The rest of the app is rendered only once a profile is active.
 */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [needPick, setNeedPick] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("et");

  useEffect(() => {
    migrateLegacy();
    const active = getActiveProfileName();
    if (!active) {
      setNeedPick(true);
    } else {
      setLang(loadSettings().uiLang);
    }
    setReady(true);
    const onChange = () => {
      const a = getActiveProfileName();
      setNeedPick(!a);
      setLang(loadSettings().uiLang);
    };
    window.addEventListener("korda:profile", onChange);
    window.addEventListener("korda:settings", onChange);
    return () => {
      window.removeEventListener("korda:profile", onChange);
      window.removeEventListener("korda:settings", onChange);
    };
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      createProfile(name);
      setName("");
      setNeedPick(false);
    } catch (err: any) {
      setError(err?.message ?? "Error");
    }
  };

  const onPick = (n: string) => {
    setActiveProfileName(n);
    setNeedPick(false);
  };

  if (!ready) return null;

  if (needPick) {
    const profiles = listProfiles();
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-ut-navy via-ut-dark to-ut-medium">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-card p-6">
          <div className="flex items-center gap-2 text-ut-navy">
            <span className="inline-block w-9 h-9 rounded-md bg-ut-navy text-white grid place-items-center text-sm font-bold">
              UT
            </span>
            <div>
              <div className="font-semibold">Korda</div>
              <div className="text-xs text-slate-500">{t(lang, "profile.gate.kicker")}</div>
            </div>
          </div>
          <h2 className="mt-5 text-xl font-bold text-ut-navy">{t(lang, "profile.gate.title")}</h2>
          <p className="text-sm text-slate-600 mt-1">{t(lang, "profile.gate.body")}</p>

          {profiles.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                {t(lang, "profile.gate.existing")}
              </div>
              <ul className="space-y-1">
                {profiles
                  .slice()
                  .sort((a, b) => b.lastSeen - a.lastSeen)
                  .map((p) => (
                    <li key={p.name}>
                      <button
                        onClick={() => onPick(p.name)}
                        className="w-full text-left px-3 py-2 rounded-md border border-slate-200 hover:border-ut-medium/60 hover:bg-slate-50 text-sm text-ut-navy flex items-center justify-between"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(p.lastSeen).toLocaleDateString()}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              {t(lang, "profile.gate.create")}
            </label>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(lang, "profile.gate.placeholder")}
                className="flex-1 px-3 py-2 rounded-md border border-slate-200 focus:border-ut-dark text-sm"
                maxLength={40}
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-ut-dark text-white text-sm font-medium hover:bg-ut-navy disabled:opacity-40"
              >
                <UserPlus size={14} /> {t(lang, "profile.gate.go")}
              </button>
            </div>
            {error && <div className="text-xs text-rose-700">{error}</div>}
            <p className="text-xs text-slate-500 pt-1">{t(lang, "profile.gate.note")}</p>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
