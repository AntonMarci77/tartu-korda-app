import type { Lang } from "./progress";

export type { Lang } from "./progress";

type Dict = Record<string, { et: string; en: string }>;

const D: Dict = {
  "nav.home": { et: "Avaleht", en: "Home" },
  "nav.learn": { et: "Õpi", en: "Learn" },
  "nav.exam": { et: "Eksam", en: "Exam" },
  "nav.weak": { et: "Nõrgad kohad", en: "Weak spots" },
  "nav.dashboard": { et: "Statistika", en: "Dashboard" },
  "nav.settings": { et: "Seaded", en: "Settings" },

  "home.kicker": { et: "Tartu Ülikool", en: "University of Tartu" },
  "home.title": {
    et: "Õpi targalt, mitte rohkem.",
    en: "Study smart, not more.",
  },
  "home.lede": {
    et: "Aktiivne meenutamine, valikvastuse hindamine, vahedega kordamine ja proovieksam — kogu sinu küsimustepank ühel kohal. Järgmine eksam 03.06.2026.",
    en: "Active recall, multiple-choice grading, spaced repetition and a mock exam — your whole question bank in one place. Next exam on 03/06/2026.",
  },
  "home.cta.learn": { et: "Alusta õppimist", en: "Start learning" },
  "home.cta.exam": { et: "Tee proovieksam", en: "Take a mock exam" },

  "tiles.learn.title": { et: "Õpi", en: "Learn" },
  "tiles.learn.text": {
    et: "Päevane režiim: meenuta, paljasta, hinda. Algoritm toob sulle järgmine kord just need kaardid, mida hakkad unustama.",
    en: "Daily driver: recall, reveal, grade. The scheduler resurfaces each card right when you're about to forget it.",
  },
  "tiles.exam.title": { et: "Proovieksam", en: "Exam simulation" },
  "tiles.exam.text": {
    et: "Päris eksami formaat: ainult valikvastused, ajaga, ilma vahepealse tagasisideta. Lõpus skoor ja selgitused.",
    en: "Real exam format: multiple choice, timed, no feedback until the end — then a scored review with explanations.",
  },
  "tiles.weak.title": { et: "Nõrgad kohad", en: "Weak spots" },
  "tiles.weak.text": {
    et: "Ainult need küsimused, mida oled valesti vastanud või madalalt hinnanud. Tegele veaga enne, kui see harjumuseks saab.",
    en: "Only the questions you got wrong or rated low. Drill the gaps before they become habits.",
  },
  "tiles.dashboard.title": { et: "Statistika", en: "Dashboard" },
  "tiles.dashboard.text": {
    et: "Iga sektsiooni mastery %, tänased kordused, täpsus ajas ja kui hästi sa enda teadmist hindad.",
    en: "Mastery % per section, today's reviews, accuracy over time, and how well your self-rating matches reality.",
  },
  "tiles.settings.title": { et: "Seaded", en: "Settings" },
  "tiles.settings.text": {
    et: "Keel, sessiooni pikkus, eksami pikkus, ekspordi ja impordi oma edasiminek JSON failina.",
    en: "Language, session size, exam length, export and import your progress as a JSON file.",
  },

  "scope.title": { et: "Vali, mida õppida", en: "Pick what to study" },
  "scope.subtitle": {
    et: "Interleaving toimub valitud blokkide sees — ühe ploki tudeerimine ei vea sind teiste teemadesse.",
    en: "Interleaving happens inside your chosen blocks — drilling one block won't drag in unrelated topics.",
  },
  "scope.all": { et: "Kõik", en: "Everything" },
  "scope.none": { et: "Tühjenda", en: "Clear" },
  "scope.continue": { et: "Edasi", en: "Continue" },
  "scope.questions": { et: "küsimust", en: "questions" },
  "scope.mc": { et: "valikvastusega", en: "multiple choice" },

  "card.recall.prompt": {
    et: "Mõtle vastus läbi, siis paljasta.",
    en: "Think the answer through, then reveal.",
  },
  "card.show": { et: "Näita vastust", en: "Show answer" },
  "card.skip": { et: "Jäta vahele", en: "Skip" },
  "card.grade.again": { et: "Uuesti", en: "Again" },
  "card.grade.hard": { et: "Raske", en: "Hard" },
  "card.grade.good": { et: "Hea", en: "Good" },
  "card.grade.easy": { et: "Lihtne", en: "Easy" },
  "card.explanation": { et: "Selgitus", en: "Explanation" },
  "card.unverified": { et: "kontrollimata", en: "unverified" },
  "card.sources": { et: "allikat", en: "sources" },
  "card.empty.title": { et: "Sessioon läbi", en: "Session done" },
  "card.empty.body": {
    et: "Sellele sessioonile rohkem kaarte pole. Vali laiem skoop või tule homme tagasi.",
    en: "No more cards for this session. Widen the scope or come back tomorrow.",
  },
  "card.session.size": { et: "Sessiooni suurus", en: "Session size" },
  "card.start": { et: "Alusta", en: "Start" },
  "card.progress": { et: "tehtud", en: "done" },
  "card.due.today": { et: "Tänased kordused", en: "Due today" },
  "card.new.available": { et: "Uued saadaval", en: "New available" },

  "exam.length": { et: "Küsimuste arv", en: "Number of questions" },
  "exam.duration": { et: "Kestus (minutit)", en: "Duration (minutes)" },
  "exam.start": { et: "Alusta eksamit", en: "Start exam" },
  "exam.submit": { et: "Lõpeta", en: "Submit" },
  "exam.q": { et: "Küsimus", en: "Question" },
  "exam.of": { et: "/", en: "of" },
  "exam.score": { et: "Tulemus", en: "Your score" },
  "exam.review": { et: "Vaata vastuseid", en: "Review answers" },
  "exam.retake": { et: "Tee uuesti", en: "Retake" },
  "exam.correct": { et: "Õige", en: "Correct" },
  "exam.your.answer": { et: "Sinu vastus", en: "Your answer" },
  "exam.not.answered": { et: "Vastamata", en: "Not answered" },
  "exam.timed.out": { et: "Aeg läbi", en: "Time's up" },
  "exam.no.mc": {
    et: "Valitud skoopis pole piisavalt valikvastustega küsimusi.",
    en: "Not enough multiple-choice questions in the selected scope.",
  },

  "weak.empty.title": { et: "Nõrku kohti pole", en: "No weak spots" },
  "weak.empty.body": {
    et: "Sa pole veel ühtegi kaarti valesti vastanud või madalalt hinnanud. Jätka Õppimist.",
    en: "You haven't missed or low-rated any cards yet. Keep at Learn.",
  },

  "dashboard.mastery": { et: "Mastery sektsioonide kaupa", en: "Mastery by section" },
  "dashboard.due.today": { et: "Tänased kordused", en: "Due today" },
  "dashboard.coverage": { et: "Kaetus", en: "Coverage" },
  "dashboard.accuracy": { et: "Täpsus", en: "Accuracy" },
  "dashboard.seen": { et: "nähtud", en: "seen" },
  "dashboard.unseen": { et: "nägemata", en: "unseen" },
  "dashboard.recent.attempts": { et: "Viimased katsed", en: "Recent attempts" },
  "dashboard.exams": { et: "Eelmised proovieksamid", en: "Previous mock exams" },
  "dashboard.no.exams": { et: "Veel ühtegi eksamit tehtud pole.", en: "No mock exams yet." },
  "dashboard.needs.review": { et: "kontrollimata kaarti", en: "unverified cards" },
  "dashboard.days.left": { et: "päeva eksamini", en: "days to exam" },

  "settings.lang": { et: "Liidese keel", en: "Interface language" },
  "settings.session.size": { et: "Vaikimisi sessiooni suurus", en: "Default session size" },
  "settings.exam.length": { et: "Vaikimisi eksami pikkus", en: "Default exam length" },
  "settings.exam.duration": { et: "Vaikimisi eksami kestus (min)", en: "Default exam duration (min)" },
  "settings.show.unverified": { et: "Näita kontrollimata kaarte", en: "Show unverified cards" },
  "settings.export": { et: "Ekspordi edasiminek", en: "Export progress" },
  "settings.import": { et: "Impordi edasiminek", en: "Import progress" },
  "settings.reset": { et: "Lähtesta kogu edasiminek", en: "Reset all progress" },
  "settings.reset.confirm": {
    et: "Kustutada kogu edasiminek? Seda ei saa tagasi võtta.",
    en: "Delete all progress? This cannot be undone.",
  },
  "settings.saved": { et: "Salvestatud", en: "Saved" },

  "profile.gate.kicker": { et: "Sisselogimine pole vajalik", en: "No sign-in needed" },
  "profile.gate.title": { et: "Vali oma profiil", en: "Pick your profile" },
  "profile.gate.body": {
    et: "Iga tudeng saab oma nime alla salvestada eraldi edasimineku. Andmed jäävad sinu brauserisse — kontot ega parooli pole.",
    en: "Each student keeps their own progress under their own name. Data stays in your browser — no account, no password.",
  },
  "profile.gate.existing": { et: "Olemasolevad profiilid", en: "Existing profiles" },
  "profile.gate.create": { et: "Loo uus profiil", en: "Create a new profile" },
  "profile.gate.placeholder": { et: "Sinu nimi", en: "Your name" },
  "profile.gate.go": { et: "Alusta", en: "Start" },
  "profile.gate.note": {
    et: "Salvestuse ülekandeks teisele seadmele kasuta Seadetes „Ekspordi“ ja „Impordi“.",
    en: "To move progress between devices, use Export / Import in Settings.",
  },

  "profile.switch": { et: "Vaheta profiili", en: "Switch profile" },
  "profile.current": { et: "Praegune", en: "Current" },
  "profile.add": { et: "Lisa profiil", en: "Add profile" },
  "profile.delete": { et: "Kustuta profiil", en: "Delete profile" },
  "profile.delete.confirm": {
    et: "Kustutada profiil „{name}“ ja kogu selle edasiminek?",
    en: "Delete profile “{name}” and all of its progress?",
  },
  "profile.section": { et: "Profiilid", en: "Profiles" },

  "card.recall.placeholder": {
    et: "Kirjuta oma vastus enne paljastamist…",
    en: "Type your answer before revealing…",
  },
  "card.choose": { et: "Vali vastus(ed)", en: "Pick answer(s)" },
  "card.submit": { et: "Kontrolli", en: "Check answer" },
  "card.reveal.options": { et: "Näita valikud", en: "Show options" },
  "card.reveal.open": { et: "Näita vastust", en: "Show answer" },
  "card.your.recall": { et: "Sinu vastus", en: "Your answer" },
  "card.correct.answer": { et: "Õige vastus", en: "Correct answer" },
  "card.result.correct": { et: "Õige!", en: "Correct!" },
  "card.result.partial": { et: "Osaliselt õige", en: "Partially correct" },
  "card.result.wrong": { et: "Vale", en: "Incorrect" },
  "card.legend.picked": { et: "Sinu valik", en: "Your pick" },
  "card.legend.missed": { et: "Jäi valimata", en: "Missed" },
  "card.grade.hint": {
    et: "Hinda end ise — algoritm näeb, millal see kaart tagasi tuua.",
    en: "Self-grade — tells the scheduler when to bring the card back.",
  },
  "card.flashcard.label": { et: "Vabavorm (lahtine küsimus)", en: "Free-text (open question)" },
};

export function t(lang: Lang, key: string): string {
  const entry = D[key];
  if (!entry) return key;
  return entry[lang] ?? entry.et;
}

export function plural(lang: Lang, n: number, et: [string, string, string], en: [string, string]): string {
  if (lang === "en") return n === 1 ? en[0] : en[1];
  if (n === 1) return et[0];
  if (n >= 2 && n <= 4) return et[1];
  return et[2];
}
