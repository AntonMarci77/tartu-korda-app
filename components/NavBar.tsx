"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Menu, X, User, Check, Plus } from "lucide-react";
import { loadSettings, saveSettings, type Lang } from "@/lib/progress";
import { t } from "@/lib/i18n";
import {
  createProfile,
  getActiveProfileName,
  listProfiles,
  setActiveProfileName,
  type Profile,
} from "@/lib/profiles";

const links = (lang: Lang) => [
  { href: "/", label: t(lang, "nav.home") },
  { href: "/learn", label: t(lang, "nav.learn") },
  { href: "/exam", label: t(lang, "nav.exam") },
  { href: "/weak", label: t(lang, "nav.weak") },
  { href: "/dashboard", label: t(lang, "nav.dashboard") },
  { href: "/settings", label: t(lang, "nav.settings") },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("et");
  const [active, setActive] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => {
      setLang(loadSettings().uiLang);
      setActive(getActiveProfileName());
      setProfiles(listProfiles());
    };
    refresh();
    window.addEventListener("korda:settings", refresh);
    window.addEventListener("korda:profile", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("korda:settings", refresh);
      window.removeEventListener("korda:profile", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dropRef.current) return;
      if (!dropRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    if (profileOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const toggleLang = () => {
    const next: Lang = lang === "et" ? "en" : "et";
    setLang(next);
    saveSettings({ ...loadSettings(), uiLang: next });
    window.dispatchEvent(new Event("korda:settings"));
  };

  const switchTo = (name: string) => {
    setActiveProfileName(name);
    setProfileOpen(false);
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const n = newName.trim();
    if (!n) return;
    try {
      createProfile(n);
      setNewName("");
      setProfileOpen(false);
    } catch {
      // ignore duplicate name silently — UI will show profiles list
    }
  };

  const items = links(lang);

  return (
    <header className="no-print sticky top-0 z-30 bg-ut-navy text-white shadow-card">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block w-7 h-7 rounded-md bg-white text-ut-navy grid place-items-center text-sm font-bold">
            UT
          </span>
          <span className="hidden xs:inline sm:inline">Korda</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {items.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                isActive(l.href)
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="hidden md:inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 transition"
            aria-label="Toggle language"
            title={lang === "et" ? "Switch to English" : "Vaheta eesti keelele"}
          >
            {lang === "et" ? "ET · EN" : "EN · ET"}
          </button>
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 max-w-[140px]"
              aria-label="Profile menu"
            >
              <User size={12} />
              <span className="truncate">{active ?? "—"}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white text-slate-800 shadow-card border border-slate-200 p-2 z-40">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">
                  {t(lang, "profile.switch")}
                </div>
                <ul className="space-y-0.5 max-h-60 overflow-auto">
                  {profiles
                    .slice()
                    .sort((a, b) => b.lastSeen - a.lastSeen)
                    .map((p) => (
                      <li key={p.name}>
                        <button
                          onClick={() => switchTo(p.name)}
                          className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-slate-100 ${
                            p.name === active ? "bg-ut-light/30 text-ut-navy" : ""
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          {p.name === active && (
                            <Check size={14} className="text-ut-dark shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                </ul>
                <form
                  onSubmit={onAdd}
                  className="mt-2 pt-2 border-t border-slate-100 flex gap-1"
                >
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t(lang, "profile.add")}
                    className="flex-1 px-2 py-1.5 rounded-md border border-slate-200 text-sm focus:border-ut-dark"
                    maxLength={40}
                  />
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-ut-dark text-white text-xs font-medium hover:bg-ut-navy disabled:opacity-40"
                  >
                    <Plus size={12} />
                  </button>
                </form>
              </div>
            )}
          </div>
          <button
            onClick={toggleLang}
            className="md:hidden px-2 py-1 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20"
          >
            {lang.toUpperCase()}
          </button>
          <button
            aria-label="Open menu"
            className="md:hidden p-2 rounded-md hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-white/10 bg-ut-navy">
          <ul className="px-2 py-2 flex flex-col">
            {items.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base transition ${
                    isActive(l.href)
                      ? "bg-white/15 text-white"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
