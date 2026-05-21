export type SectionId =
  | "vaskulaar"
  | "uroloogia"
  | "lastekirurgia"
  | "uldkirurgia"
  | "trauma";

export const ALL_SECTIONS: SectionId[] = [
  "vaskulaar",
  "uroloogia",
  "lastekirurgia",
  "uldkirurgia",
  "trauma",
];

export type QuestionType = "mc" | "open";

export interface Question {
  id: string;
  section: SectionId;
  question: string;
  choices: Record<string, string>;
  answer: string;
  type: QuestionType;
  sources: string[];
  source_count: number;
  needs_review?: boolean;
}

export interface SectionFile {
  section: SectionId;
  count: number;
  questions: Question[];
}

export interface IndexFile {
  section_order: SectionId[];
  stats: Record<
    SectionId,
    {
      total: number;
      mc: number;
      with_answer: number;
      needs_review: number;
      multi_source: number;
    }
  >;
  totals: {
    questions: number;
    mc: number;
    with_answer: number;
    needs_review: number;
  };
}

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  box: number;
  ease: number;
  intervalDays: number;
  dueDate: number; // epoch ms
  lapses: number;
  lastResult: Grade | null;
  seenCount: number;
  correctCount: number;
  lastReviewed: number; // epoch ms
}

export interface ExamResultEntry {
  id: string;
  picked: string | null;
  correct: boolean;
  ms: number;
}

export interface ExamRun {
  startedAt: number;
  finishedAt: number;
  scope: SectionId[];
  length: number;
  durationMin: number;
  entries: ExamResultEntry[];
  score: number; // 0..1
}
