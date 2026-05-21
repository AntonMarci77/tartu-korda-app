"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload, Trash2, Check, UserPlus, User } from "lucide-react";
import type { Lang } from "@/lib/progress";
import {
  DEFAULT_SETTINGS,
  exportAll,
  importAll,
  loadSettings,
  resetAll,
  saveSettings,
  type Settings,
  type ExportBlob,
} from "@/lib/progress";
import {
  createProfile,
  deleteProfile,
  getActiveProfileName,
  listProfiles,
  setActiveProfileName,
  type Profile,
} from "@/lib/profiles";
import { t } from "@/lib/i18n";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lang = settings.uiLang;

  useEffect(() => {
    setSettings(loadSettings());
    setProfiles(listProfiles());
    setActiveName(getActiveProfileName());
    const refresh = () => {
      setSettings(loadSettings());
      setProfiles(listProfiles());
      setActiveName(getActiveProfileName());
    };
    window.addEventListener("korda:profile", refresh);
    return () => window.removeEventListener("korda:profile", refresh);
  }, []);

  const addProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const n = newName.trim();
    if (!n) return;
    try {
      createProfile(n);
      setNewName("");
    } catch {
      // duplicate — silent
    }
  };

  const switchTo = (n: string) => setActiveProfileName(n);

  const removeProfile = (n: string) => {
    const msg = t(lang, "profile.delete.confirm").replace("{name}", n);
    if (!confirm(msg)) return;
    deleteProfile(n);
  };

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    saveSettings(next);
    window.dispatchEvent(new Event("korda:settings"));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const onExport = () => {
    const blob = exportAll(activeName ?? undefined);
    const data = JSON.stringify(blob, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `korda-${activeName ?? "progress"}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const blob = JSON.parse(text) as ExportBlob;
      importAll(blob);
      const fresh = loadSettings();
      setSettings(fresh);
      window.dispatchEvent(new Event("korda:settings"));
      setImportMsg(lang === "et" ? "Imporditud." : "Imported.");
      setTimeout(() => setImportMsg(null), 1500);
    } catch (err) {
      setImportMsg(lang === "et" ? "Vigane fail." : "Invalid file.");
      setTimeout(() => setImportMsg(null), 2000);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onReset = () => {
    if (!confirm(t(lang, "settings.reset.confirm"))) return;
    resetAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-ut-navy">
          {t(lang, "nav.settings")}
        </h1>
        <Link
          href="/"
          className="text-sm text-ut-dark hover:text-ut-navy inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> {t(lang, "nav.home")}
        </Link>
      </header>

      {saved && (
        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
          <Check size={12} /> {t(lang, "settings.saved")}
        </div>
      )}

      <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-ut-navy">{t(lang, "profile.section")}</h2>
          <ul className="mt-3 space-y-1.5">
            {profiles.map((p) => (
              <li
                key={p.name}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                  p.name === activeName
                    ? "border-ut-medium bg-ut-light/10"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <User size={14} className="text-ut-medium shrink-0" />
                  <span className="font-medium text-ut-navy truncate">{p.name}</span>
                  {p.name === activeName && (
                    <span className="text-[10px] uppercase tracking-wider text-ut-dark bg-ut-light/30 rounded px-1.5 py-0.5">
                      {t(lang, "profile.current")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.name !== activeName && (
                    <button
                      onClick={() => switchTo(p.name)}
                      className="text-xs px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
                    >
                      {t(lang, "profile.switch")}
                    </button>
                  )}
                  {profiles.length > 1 && (
                    <button
                      onClick={() => removeProfile(p.name)}
                      className="text-xs px-2 py-1 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                      title={t(lang, "profile.delete")}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={addProfile} className="mt-3 flex gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t(lang, "profile.add")}
              maxLength={40}
              className="flex-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-ut-dark text-white text-sm font-medium hover:bg-ut-navy disabled:opacity-40"
            >
              <UserPlus size={12} /> {t(lang, "profile.add")}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-ut-navy">{t(lang, "settings.lang")}</label>
          <div className="mt-2 flex gap-2">
            {(["et", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => update("uiLang", l)}
                className={`px-4 py-2 rounded-md text-sm border ${
                  settings.uiLang === l
                    ? "bg-ut-dark text-white border-ut-dark"
                    : "bg-white text-ut-navy border-slate-200 hover:border-ut-medium/60"
                }`}
              >
                {l === "et" ? "Eesti" : "English"}
              </button>
            ))}
          </div>
        </div>

        <NumField
          label={t(lang, "settings.session.size")}
          value={settings.sessionSize}
          min={1}
          max={500}
          onChange={(v) => update("sessionSize", v)}
        />

        <NumField
          label={t(lang, "settings.exam.length")}
          value={settings.examLength}
          min={5}
          max={200}
          onChange={(v) => update("examLength", v)}
        />

        <NumField
          label={t(lang, "settings.exam.duration")}
          value={settings.examDurationMin}
          min={1}
          max={240}
          onChange={(v) => update("examDurationMin", v)}
        />

        <label className="flex items-center gap-2 text-sm text-ut-navy">
          <input
            type="checkbox"
            checked={settings.showUnverified}
            onChange={(e) => update("showUnverified", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          {t(lang, "settings.show.unverified")}
        </label>
      </section>

      <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 space-y-3">
        <h2 className="font-semibold text-ut-navy">
          {lang === "et" ? "Edasiminek" : "Progress"}
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
          >
            <Download size={14} /> {t(lang, "settings.export")}
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
          >
            <Upload size={14} /> {t(lang, "settings.import")}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            onChange={onImport}
            className="hidden"
          />
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm"
          >
            <Trash2 size={14} /> {t(lang, "settings.reset")}
          </button>
        </div>
        {importMsg && <div className="text-xs text-slate-600">{importMsg}</div>}
        <p className="text-xs text-slate-500">
          {lang === "et"
            ? "Edasiminek hoitakse sinu brauseris (localStorage). Ekspordi fail aitab teisele seadmele üle minna või varundada."
            : "Progress is kept in your browser (localStorage). Export it as a JSON file to move devices or back up."}
        </p>
      </section>
    </div>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ut-navy">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="mt-2 block w-28 px-2 py-1.5 rounded-md border border-slate-200 text-sm"
      />
    </div>
  );
}
