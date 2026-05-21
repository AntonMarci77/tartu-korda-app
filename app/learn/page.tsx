"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ScopePicker } from "@/components/ScopePicker";
import { Card } from "@/components/Card";
import type { Lang } from "@/lib/progress";
import {
  loadProgress,
  loadSettings,
  saveSettings,
  setCardState,
} from "@/lib/progress";
import { t } from "@/lib/i18n";
import { applyGrade, isDue } from "@/lib/scheduler";
import { loadSections, interleaveBySection } from "@/lib/data";
import { setActiveScope } from "@/lib/scope";
import type { Grade, Question, SectionId } from "@/lib/types";

type Phase = "scope" | "size" | "card" | "done";

export default function LearnPage() {
  const [lang, setLang] = useState<Lang>("et");
  const [scope, setScope] = useState<SectionId[]>([]);
  const [phase, setPhase] = useState<Phase>("scope");
  const [sessionSize, setSessionSize] = useState(30);
  const [queue, setQueue] = useState<Question[]>([]);
  const [pool, setPool] = useState<{ due: Question[]; news: Question[] }>({ due: [], news: [] });
  const [completed, setCompleted] = useState(0);
  const [targetSize, setTargetSize] = useState(30);

  useEffect(() => {
    const s = loadSettings();
    setLang(s.uiLang);
    setScope(s.lastScope.length ? s.lastScope : []);
    setSessionSize(s.sessionSize);
  }, []);

  const startSession = async () => {
    setActiveScope(scope);
    const all = await loadSections(scope);
    const progress = loadProgress();
    const now = Date.now();
    const due: Question[] = [];
    const news: Question[] = [];
    for (const q of all) {
      const st = progress[q.id] ?? null;
      if (!st) news.push(q);
      else if (isDue(st, now)) due.push(q);
    }
    // Interleave within each pool
    const dueQ = interleaveBySection(due);
    const newQ = interleaveBySection(news);
    setPool({ due: dueQ, news: newQ });

    const target = Math.min(sessionSize, dueQ.length + newQ.length);
    const combined: Question[] = [];
    // Prioritise due, then top up with news.
    let i = 0;
    let j = 0;
    while (combined.length < target) {
      if (i < dueQ.length) combined.push(dueQ[i++]);
      else if (j < newQ.length) combined.push(newQ[j++]);
      else break;
    }
    setQueue(combined);
    setTargetSize(combined.length);
    setCompleted(0);
    setPhase("card");

    // Persist session size as default
    const s = loadSettings();
    saveSettings({ ...s, sessionSize, lastScope: scope });
  };

  const onGrade = (g: Grade) => {
    if (queue.length === 0) return;
    const [head, ...rest] = queue;
    const prev = loadProgress()[head.id] ?? null;
    const next = applyGrade(prev, g);
    setCardState(head.id, next);

    let newQueue = rest;
    // If "again", re-queue this card near the end so the student sees it again.
    if (g === "again") {
      const insertAt = Math.min(rest.length, 4);
      newQueue = [...rest.slice(0, insertAt), head, ...rest.slice(insertAt)];
    } else {
      setCompleted((c) => c + 1);
    }

    if (newQueue.length === 0) setPhase("done");
    setQueue(newQueue);
  };

  const onSkip = () => {
    if (queue.length <= 1) {
      setQueue([]);
      setPhase("done");
      return;
    }
    const [head, ...rest] = queue;
    setQueue([...rest, head]);
  };

  const totalAvail = pool.due.length + pool.news.length;
  const progress = targetSize > 0 ? Math.round((completed / targetSize) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-ut-navy">
          {t(lang, "nav.learn")}
        </h1>
        <Link
          href="/"
          className="text-sm text-ut-dark hover:text-ut-navy inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> {t(lang, "nav.home")}
        </Link>
      </header>

      {phase === "scope" && (
        <ScopePicker
          lang={lang}
          scope={scope}
          onChange={setScope}
          onContinue={() => setPhase("size")}
        />
      )}

      {phase === "size" && (
        <SessionSize
          lang={lang}
          value={sessionSize}
          onChange={setSessionSize}
          onStart={startSession}
          onBack={() => setPhase("scope")}
        />
      )}

      {phase === "card" && queue.length > 0 && (
        <>
          <ProgressBar lang={lang} done={completed} total={targetSize} percent={progress} />
          <Card
            lang={lang}
            question={queue[0]}
            showUnverified={loadSettings().showUnverified}
            onGrade={onGrade}
            onSkip={onSkip}
          />
          <PoolHints lang={lang} due={pool.due.length} news={pool.news.length} />
        </>
      )}

      {phase === "done" && (
        <div className="rounded-2xl bg-white shadow-card border border-slate-100 p-6 text-center">
          <Sparkles className="mx-auto text-ut-orange mb-2" size={28} />
          <h2 className="text-xl font-semibold text-ut-navy">{t(lang, "card.empty.title")}</h2>
          <p className="text-sm text-slate-600 mt-2">{t(lang, "card.empty.body")}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setPhase("scope")}
              className="px-4 py-2 rounded-md bg-ut-dark text-white text-sm hover:bg-ut-navy"
            >
              {t(lang, "scope.title")}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
            >
              {t(lang, "nav.dashboard")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  lang,
  done,
  total,
  percent,
}: {
  lang: Lang;
  done: number;
  total: number;
  percent: number;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-100 px-4 py-3 shadow-card">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>
          {done} / {total} {t(lang, "card.progress")}
        </span>
        <span className="font-medium text-ut-dark">{percent}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-ut-dark to-ut-medium transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function PoolHints({ lang, due, news }: { lang: Lang; due: number; news: number }) {
  return (
    <div className="text-xs text-slate-500 flex flex-wrap gap-3 px-1">
      <span>
        {t(lang, "card.due.today")}: <b className="text-ut-navy">{due}</b>
      </span>
      <span>
        {t(lang, "card.new.available")}: <b className="text-ut-navy">{news}</b>
      </span>
    </div>
  );
}

function SessionSize({
  lang,
  value,
  onChange,
  onStart,
  onBack,
}: {
  lang: Lang;
  value: number;
  onChange: (n: number) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const presets = [10, 20, 30, 50, 100, 200];
  return (
    <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ut-navy">{t(lang, "card.session.size")}</h2>
        <p className="text-sm text-slate-600 mt-1">
          {lang === "et"
            ? "Vali, mitu kaarti tahad selles sessioonis teha. Suurem arv = pikem sessioon."
            : "Pick how many cards to do in this session. Bigger = longer."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
              value === n
                ? "bg-ut-dark text-white border-ut-dark"
                : "bg-white text-ut-navy border-slate-200 hover:border-ut-medium/60"
            }`}
          >
            {n}
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={1744}
          value={value}
          onChange={(e) => onChange(Math.max(1, Math.min(1744, Number(e.target.value) || 1)))}
          className="w-20 px-2 py-2 rounded-md border border-slate-200 text-sm"
        />
      </div>
      <div className="flex justify-between gap-2 pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
        >
          ← {t(lang, "scope.title")}
        </button>
        <button
          onClick={onStart}
          className="px-4 py-2 rounded-md bg-ut-dark text-white text-sm font-medium hover:bg-ut-navy"
        >
          {t(lang, "card.start")}
        </button>
      </div>
    </section>
  );
}
