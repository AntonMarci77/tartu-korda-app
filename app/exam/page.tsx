"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Clock, AlertTriangle, Check, X } from "lucide-react";
import { ScopePicker } from "@/components/ScopePicker";
import type { Lang } from "@/lib/progress";
import {
  loadSettings,
  saveSettings,
  pushExam,
  setCardState,
  loadProgress,
} from "@/lib/progress";
import { t } from "@/lib/i18n";
import { loadSections, interleaveBySection, shuffle } from "@/lib/data";
import { setActiveScope } from "@/lib/scope";
import { applyGrade } from "@/lib/scheduler";
import type { ExamResultEntry, ExamRun, Question, SectionId } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/sections";

type Phase = "scope" | "config" | "running" | "review";

export default function ExamPage() {
  const [lang, setLang] = useState<Lang>("et");
  const [scope, setScope] = useState<SectionId[]>([]);
  const [phase, setPhase] = useState<Phase>("scope");
  const [length, setLength] = useState(40);
  const [durationMin, setDurationMin] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pos, setPos] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<ExamRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setLang(s.uiLang);
    setScope(s.lastScope.length ? s.lastScope : []);
    setLength(s.examLength);
    setDurationMin(s.examDurationMin);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startExam = async () => {
    setActiveScope(scope);
    const all = await loadSections(scope);
    const mc = all.filter(
      (q) =>
        q.type === "mc" &&
        Object.keys(q.choices ?? {}).length >= 2 &&
        q.answer &&
        /^[a-z]/i.test(q.answer.trim()),
    );
    if (mc.length === 0) {
      setError(t(lang, "exam.no.mc"));
      return;
    }
    const interleaved = interleaveBySection(mc);
    const seed = Date.now();
    const pool = shuffle(interleaved, seed);
    const final = pool.slice(0, Math.min(length, pool.length));
    setQuestions(final);
    setAnswers({});
    setPos(0);
    setStartedAt(Date.now());
    setSecondsLeft(durationMin * 60);
    setError(null);
    setPhase("running");

    saveSettings({
      ...loadSettings(),
      examLength: length,
      examDurationMin: durationMin,
      lastScope: scope,
    });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishExam(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const finishExam = (timedOut: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finishedAt = Date.now();
    const entries: ExamResultEntry[] = questions.map((q) => {
      const picked = answers[q.id] ?? null;
      const correctLetter = q.answer.trim().toLowerCase().slice(0, 1);
      const correct = picked != null && picked === correctLetter;
      return { id: q.id, picked, correct, ms: 0 };
    });
    const score = entries.length ? entries.filter((e) => e.correct).length / entries.length : 0;
    const run: ExamRun = {
      startedAt,
      finishedAt,
      scope,
      length: questions.length,
      durationMin,
      entries,
      score,
    };
    pushExam(run);

    // Feed grades back into the SR scheduler: correct -> good, wrong/blank -> again.
    const progress = loadProgress();
    for (const e of entries) {
      const prev = progress[e.id] ?? null;
      const next = applyGrade(prev, e.correct ? "good" : "again");
      setCardState(e.id, next);
    }

    setResult(run);
    setPhase("review");
  };

  const select = (qid: string, key: string) => {
    setAnswers((a) => ({ ...a, [qid]: key }));
  };

  const next = () => setPos((p) => Math.min(questions.length - 1, p + 1));
  const prev = () => setPos((p) => Math.max(0, p - 1));

  const answered = Object.keys(answers).length;
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-ut-navy">{t(lang, "nav.exam")}</h1>
        <Link
          href="/"
          className="text-sm text-ut-dark hover:text-ut-navy inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> {t(lang, "nav.home")}
        </Link>
      </header>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 text-sm flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {phase === "scope" && (
        <ScopePicker
          lang={lang}
          scope={scope}
          onChange={setScope}
          onContinue={() => setPhase("config")}
        />
      )}

      {phase === "config" && (
        <section className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ut-navy flex items-center gap-2">
              <ClipboardCheck size={18} /> {t(lang, "nav.exam")}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {lang === "et"
                ? "Päris eksami formaat: ainult valikvastused, ajaga, tagasiside lõpus."
                : "Real exam format: multiple choice, timed, feedback at the end."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberField
              label={t(lang, "exam.length")}
              value={length}
              min={5}
              max={200}
              onChange={setLength}
              presets={[20, 30, 40, 60, 100]}
            />
            <NumberField
              label={t(lang, "exam.duration")}
              value={durationMin}
              min={1}
              max={240}
              onChange={setDurationMin}
              presets={[15, 30, 45, 60, 90]}
            />
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <button
              onClick={() => setPhase("scope")}
              className="px-4 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
            >
              ← {t(lang, "scope.title")}
            </button>
            <button
              onClick={startExam}
              className="px-4 py-2 rounded-md bg-ut-dark text-white text-sm font-medium hover:bg-ut-navy"
            >
              {t(lang, "exam.start")}
            </button>
          </div>
        </section>
      )}

      {phase === "running" && questions.length > 0 && (
        <ExamRunner
          lang={lang}
          questions={questions}
          pos={pos}
          answers={answers}
          onSelect={select}
          onNext={next}
          onPrev={prev}
          onSubmit={() => finishExam(false)}
          mm={mm}
          ss={ss}
          answered={answered}
        />
      )}

      {phase === "review" && result && (
        <ExamReview lang={lang} run={result} questions={questions} onRetake={() => setPhase("config")} />
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  presets,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  presets: number[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`px-3 py-1.5 rounded-md text-sm border ${
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
          min={min}
          max={max}
          value={value}
          onChange={(e) =>
            onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))
          }
          className="w-20 px-2 py-1.5 rounded-md border border-slate-200 text-sm"
        />
      </div>
    </div>
  );
}

function ExamRunner({
  lang,
  questions,
  pos,
  answers,
  onSelect,
  onNext,
  onPrev,
  onSubmit,
  mm,
  ss,
  answered,
}: {
  lang: Lang;
  questions: Question[];
  pos: number;
  answers: Record<string, string>;
  onSelect: (qid: string, k: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  mm: number;
  ss: number;
  answered: number;
}) {
  const q = questions[pos];
  const choiceKeys = Object.keys(q.choices ?? {}).sort();
  const picked = answers[q.id];

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 bg-[#F5F8FC]/95 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="text-ut-navy font-medium">
            {t(lang, "exam.q")} {pos + 1} {t(lang, "exam.of")} {questions.length}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {answered} / {questions.length}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ut-navy text-white text-xs font-mono">
              <Clock size={12} /> {mm.toString().padStart(2, "0")}:{ss.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-ut-dark transition-all"
            style={{ width: `${((pos + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <article className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 sm:p-6">
        <div className="text-xs uppercase tracking-wider text-ut-medium font-semibold mb-2">
          {SECTION_LABELS[q.section][lang]}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-ut-navy leading-snug whitespace-pre-line">
          {q.question}
        </h2>
        <ul className="mt-5 space-y-2">
          {choiceKeys.map((k) => {
            const sel = picked === k;
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => onSelect(q.id, k)}
                  className={`w-full text-left flex gap-3 rounded-lg border p-3 text-sm transition ${
                    sel
                      ? "border-ut-dark bg-ut-light/20"
                      : "border-slate-200 bg-white hover:border-ut-medium/60"
                  }`}
                >
                  <span
                    className={`shrink-0 w-7 h-7 rounded-md grid place-items-center font-bold text-xs ${
                      sel ? "bg-ut-dark text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {k.toUpperCase()}
                  </span>
                  <span className="text-slate-800">{q.choices[k]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </article>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onPrev}
          disabled={pos === 0}
          className="px-4 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50 disabled:opacity-40"
        >
          ←
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-md bg-ut-orange text-white text-sm font-medium hover:opacity-90"
          >
            {t(lang, "exam.submit")}
          </button>
          <button
            onClick={onNext}
            disabled={pos === questions.length - 1}
            className="px-4 py-2 rounded-md bg-ut-dark text-white text-sm hover:bg-ut-navy disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}

function ExamReview({
  lang,
  run,
  questions,
  onRetake,
}: {
  lang: Lang;
  run: ExamRun;
  questions: Question[];
  onRetake: () => void;
}) {
  const pct = Math.round(run.score * 100);
  const minutes = Math.round((run.finishedAt - run.startedAt) / 60000);
  return (
    <div className="space-y-4">
      <section
        className={`rounded-2xl text-white shadow-card overflow-hidden bg-gradient-to-br ${
          pct >= 75
            ? "from-emerald-600 to-emerald-500"
            : pct >= 50
              ? "from-ut-dark to-ut-medium"
              : "from-rose-600 to-rose-500"
        }`}
      >
        <div className="px-6 py-6">
          <div className="text-xs uppercase tracking-widest opacity-80">{t(lang, "exam.score")}</div>
          <div className="mt-1 text-5xl font-bold">{pct}%</div>
          <div className="mt-2 text-sm opacity-90">
            {run.entries.filter((e) => e.correct).length} / {run.entries.length} ·{" "}
            {minutes} min
          </div>
          <button
            onClick={onRetake}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-sm font-medium"
          >
            {t(lang, "exam.retake")}
          </button>
        </div>
      </section>

      <h3 className="font-semibold text-ut-navy mt-4">{t(lang, "exam.review")}</h3>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const e = run.entries.find((x) => x.id === q.id);
          const correctLetter = q.answer.trim().toLowerCase().slice(0, 1);
          return (
            <article
              key={q.id}
              className="rounded-xl bg-white shadow-card border border-slate-100 p-4 text-sm"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-7 h-7 rounded-md grid place-items-center font-bold text-xs ${
                    e?.correct
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
                  }`}
                  title={e?.correct ? "OK" : "X"}
                >
                  {e?.correct ? <Check size={14} /> : <X size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-ut-medium font-semibold">
                    {SECTION_LABELS[q.section][lang]} · {i + 1}
                  </div>
                  <div className="font-medium text-ut-navy mt-0.5 whitespace-pre-line">
                    {q.question}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {Object.keys(q.choices)
                      .sort()
                      .map((k) => {
                        const isCorrect = k === correctLetter;
                        const isPicked = e?.picked === k;
                        return (
                          <li
                            key={k}
                            className={`flex gap-2 px-2 py-1 rounded text-xs ${
                              isCorrect
                                ? "bg-emerald-50 text-emerald-900"
                                : isPicked
                                  ? "bg-rose-50 text-rose-900"
                                  : "text-slate-600"
                            }`}
                          >
                            <span className="font-bold w-4">{k.toUpperCase()}</span>
                            <span>{q.choices[k]}</span>
                            {isPicked && !isCorrect && (
                              <span className="ml-auto text-[10px] uppercase opacity-70">
                                {t(lang, "exam.your.answer")}
                              </span>
                            )}
                            {isCorrect && (
                              <span className="ml-auto text-[10px] uppercase opacity-70">
                                {t(lang, "exam.correct")}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    {!e?.picked && (
                      <li className="text-[10px] uppercase text-amber-700 mt-1">
                        {t(lang, "exam.not.answered")}
                      </li>
                    )}
                  </ul>
                  {q.answer.length > 30 && (
                    <div className="mt-2 text-xs text-slate-600 whitespace-pre-line border-l-2 border-ut-light pl-2">
                      {q.answer}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
