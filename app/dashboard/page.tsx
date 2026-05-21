"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, BarChart2, Activity, AlertTriangle } from "lucide-react";
import type { Lang } from "@/lib/progress";
import { loadExams, loadProgress, loadSettings } from "@/lib/progress";
import { t } from "@/lib/i18n";
import { loadAll, loadIndex } from "@/lib/data";
import { isDue, masteryScore } from "@/lib/scheduler";
import type { ExamRun, IndexFile, Question, SectionId } from "@/lib/types";
import { ALL_SECTIONS } from "@/lib/types";
import { SECTION_LABELS, SECTION_ACCENT } from "@/lib/sections";

interface SectionStats {
  total: number;
  seen: number;
  due: number;
  mastery: number;
  accuracy: number;
}

function daysToExam(): number {
  const exam = new Date(2026, 5, 3, 0, 0, 0).getTime();
  return Math.max(0, Math.ceil((exam - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>("et");
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [stats, setStats] = useState<Record<SectionId, SectionStats> | null>(null);
  const [exams, setExams] = useState<ExamRun[]>([]);
  const [totals, setTotals] = useState<{ seen: number; total: number; needsReview: number } | null>(null);

  useEffect(() => {
    setLang(loadSettings().uiLang);
    setExams(loadExams());
    (async () => {
      const [idx, all] = await Promise.all([loadIndex(), loadAll()]);
      setIndex(idx);
      const progress = loadProgress();
      const now = Date.now();
      const out: Record<SectionId, SectionStats> = {} as any;
      for (const s of ALL_SECTIONS) {
        out[s] = { total: 0, seen: 0, due: 0, mastery: 0, accuracy: 0 };
      }
      let totalCorrect = 0;
      let totalSeenAttempts = 0;
      let seenCount = 0;
      let needsReview = 0;
      let totalMasterySum: Record<SectionId, number> = {} as any;
      for (const s of ALL_SECTIONS) totalMasterySum[s] = 0;

      for (const q of all) {
        const ss = out[q.section];
        ss.total += 1;
        if (q.needs_review) needsReview += 1;
        const st = progress[q.id] ?? null;
        const m = masteryScore(st);
        totalMasterySum[q.section] += m;
        if (st) {
          ss.seen += 1;
          seenCount += 1;
          totalSeenAttempts += st.seenCount;
          totalCorrect += st.correctCount;
          ss.accuracy += st.seenCount ? st.correctCount / st.seenCount : 0;
        }
        if (isDue(st, now) && st) ss.due += 1;
      }
      for (const s of ALL_SECTIONS) {
        const ss = out[s];
        ss.mastery = ss.total ? totalMasterySum[s] / ss.total : 0;
        ss.accuracy = ss.seen ? ss.accuracy / ss.seen : 0;
      }
      setStats(out);
      setTotals({ seen: seenCount, total: all.length, needsReview });
    })();
  }, []);

  const days = daysToExam();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-ut-navy">
          {t(lang, "nav.dashboard")}
        </h1>
        <Link
          href="/"
          className="text-sm text-ut-dark hover:text-ut-navy inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> {t(lang, "nav.home")}
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<CalendarClock size={18} />}
          label={t(lang, "dashboard.days.left")}
          value={days.toString()}
          accent="from-ut-orange to-ut-orange/80"
        />
        <Kpi
          icon={<Activity size={18} />}
          label={t(lang, "dashboard.coverage")}
          value={
            totals ? `${totals.seen} / ${totals.total}` : "—"
          }
          accent="from-ut-medium to-ut-light"
        />
        <Kpi
          icon={<BarChart2 size={18} />}
          label={t(lang, "dashboard.due.today")}
          value={
            stats
              ? Object.values(stats).reduce((acc, s) => acc + s.due, 0).toString()
              : "—"
          }
          accent="from-ut-dark to-ut-medium"
        />
        <Kpi
          icon={<AlertTriangle size={18} />}
          label={t(lang, "dashboard.needs.review")}
          value={totals ? totals.needsReview.toString() : "—"}
          accent="from-ut-navy to-ut-dark"
        />
      </section>

      <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5">
        <h2 className="font-semibold text-ut-navy">{t(lang, "dashboard.mastery")}</h2>
        <ul className="mt-4 space-y-3">
          {ALL_SECTIONS.map((s) => {
            const ss = stats?.[s];
            const pct = ss ? Math.round(ss.mastery * 100) : 0;
            const seenPct = ss && ss.total ? Math.round((ss.seen / ss.total) * 100) : 0;
            return (
              <li key={s} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${SECTION_ACCENT[s]}`}
                    />
                    <span className="font-medium text-ut-navy">{SECTION_LABELS[s][lang]}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {ss?.seen ?? 0} {t(lang, "dashboard.seen")} ·{" "}
                    {ss ? Math.round(ss.accuracy * 100) : 0}% {t(lang, "dashboard.accuracy")}
                  </div>
                </div>
                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-ut-light/60"
                    style={{ width: `${seenPct}%` }}
                  />
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${SECTION_ACCENT[s]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>{pct}% mastery</span>
                  <span>
                    {seenPct}% {t(lang, "dashboard.seen")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5">
        <h2 className="font-semibold text-ut-navy">{t(lang, "dashboard.exams")}</h2>
        {exams.length === 0 ? (
          <p className="text-sm text-slate-500 mt-2">{t(lang, "dashboard.no.exams")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {exams.slice(0, 10).map((r, i) => {
              const pct = Math.round(r.score * 100);
              const date = new Date(r.startedAt);
              const dd = date.toLocaleDateString("et-EE");
              const cls =
                pct >= 75 ? "text-emerald-700" : pct >= 50 ? "text-ut-dark" : "text-rose-700";
              return (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-ut-navy font-medium">
                      {dd} · {r.length} Q · {r.durationMin} min
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {r.scope.map((s) => SECTION_LABELS[s][lang]).join(" · ")}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${cls}`}>{pct}%</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-card border border-slate-100 p-4">
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-md bg-gradient-to-br ${accent} text-white grid place-items-center`}
        >
          {icon}
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-ut-navy tabular-nums">{value}</div>
    </div>
  );
}
