"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  LineChart,
  Settings as SettingsIcon,
  CalendarClock,
} from "lucide-react";
import { loadSettings } from "@/lib/progress";
import type { Lang } from "@/lib/progress";
import { t } from "@/lib/i18n";

const tiles: {
  href: string;
  iconKey: "learn" | "exam" | "weak" | "dashboard" | "settings";
  accent: string;
}[] = [
  { href: "/learn", iconKey: "learn", accent: "from-ut-dark to-ut-medium" },
  { href: "/exam", iconKey: "exam", accent: "from-ut-navy to-ut-dark" },
  { href: "/weak", iconKey: "weak", accent: "from-ut-medium to-ut-light" },
  { href: "/dashboard", iconKey: "dashboard", accent: "from-ut-light to-ut-medium" },
  { href: "/settings", iconKey: "settings", accent: "from-ut-medium to-ut-dark" },
];

const Icon = ({ k, size = 20 }: { k: (typeof tiles)[number]["iconKey"]; size?: number }) => {
  switch (k) {
    case "learn":
      return <BookOpen size={size} />;
    case "exam":
      return <ClipboardCheck size={size} />;
    case "weak":
      return <AlertTriangle size={size} />;
    case "dashboard":
      return <LineChart size={size} />;
    case "settings":
      return <SettingsIcon size={size} />;
  }
};

function daysToExam(): number {
  // Exam date: 2026-06-03 local
  const exam = new Date(2026, 5, 3, 0, 0, 0).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((exam - now) / (24 * 60 * 60 * 1000)));
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("et");
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setLang(loadSettings().uiLang);
    setDays(daysToExam());
    const refresh = () => setLang(loadSettings().uiLang);
    window.addEventListener("korda:settings", refresh);
    return () => window.removeEventListener("korda:settings", refresh);
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-ut-navy via-ut-dark to-ut-medium text-white shadow-card overflow-hidden">
        <div className="px-6 sm:px-10 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            {t(lang, "home.title")}
          </h1>
          <p className="mt-3 text-white/85 max-w-2xl text-sm sm:text-base">
            {t(lang, "home.lede")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-ut-navy px-4 py-2 text-sm font-medium shadow hover:bg-ut-light transition"
            >
              {t(lang, "home.cta.learn")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10 transition"
            >
              <ClipboardCheck size={16} /> {t(lang, "home.cta.exam")}
            </Link>
          </div>
          {days !== null && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ut-orange/90 text-white px-3 py-1.5 text-xs font-semibold">
              <CalendarClock size={14} />
              {days} {t(lang, "dashboard.days.left")} · 03/06/2026
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-2xl bg-white shadow-card border border-slate-100 p-5 hover:border-ut-medium/60 transition flex flex-col"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tile.accent} text-white grid place-items-center mb-3`}
            >
              <Icon k={tile.iconKey} />
            </div>
            <h3 className="font-semibold text-ut-navy">{t(lang, `tiles.${tile.iconKey}.title`)}</h3>
            <p className="text-sm text-slate-600 mt-1 flex-1">{t(lang, `tiles.${tile.iconKey}.text`)}</p>
            <span className="mt-3 inline-flex items-center text-sm text-ut-dark group-hover:text-ut-navy">
              {t(lang, "scope.continue")}{" "}
              <ArrowRight size={14} className="ml-1 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 sm:p-6">
        <h2 className="font-semibold text-ut-navy">
          {lang === "et" ? "Kuidas üks õppesessioon välja näeb" : "How a study session goes"}
        </h2>
        <ol className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
          <li className="rounded-lg border border-slate-100 p-3">
            <span className="font-medium text-ut-dark">
              1. {lang === "et" ? "Vali skoop." : "Pick a scope."}
            </span>{" "}
            {lang === "et"
              ? "Üks plokk (nt uroloogia) või kõik viis korraga."
              : "One block (e.g. urology) or all five at once."}
          </li>
          <li className="rounded-lg border border-slate-100 p-3">
            <span className="font-medium text-ut-dark">
              2. {lang === "et" ? "Meenuta enne paljastamist." : "Recall before reveal."}
            </span>{" "}
            {lang === "et"
              ? "Mõtle vastus läbi, alles siis vajuta „Näita“."
              : "Think the answer through, then tap “Show”."}
          </li>
          <li className="rounded-lg border border-slate-100 p-3">
            <span className="font-medium text-ut-dark">
              3. {lang === "et" ? "Hinda end." : "Self-grade."}
            </span>{" "}
            {lang === "et"
              ? "„Uuesti / Raske / Hea / Lihtne“ määrab, millal kaart tagasi tuleb."
              : "“Again / Hard / Good / Easy” sets when the card returns."}
          </li>
          <li className="rounded-lg border border-slate-100 p-3">
            <span className="font-medium text-ut-dark">
              4. {lang === "et" ? "Tee proovieksam." : "Take a mock exam."}
            </span>{" "}
            {lang === "et"
              ? "Aja peale, ainult valikvastused, lõpus selgitused."
              : "Timed, multiple-choice only, with explanations at the end."}
          </li>
        </ol>
      </section>
    </div>
  );
}
