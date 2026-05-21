import type { SectionId } from "./types";

export const SECTION_LABELS: Record<SectionId, { et: string; en: string }> = {
  vaskulaar: { et: "Vaskulaarkirurgia", en: "Vascular surgery" },
  uroloogia: { et: "Uroloogia", en: "Urology" },
  lastekirurgia: { et: "Lastekirurgia", en: "Paediatric surgery" },
  uldkirurgia: { et: "Üldkirurgia", en: "General surgery" },
  trauma: { et: "Trauma", en: "Trauma" },
};

export const SECTION_ACCENT: Record<SectionId, string> = {
  vaskulaar: "from-ut-dark to-ut-medium",
  uroloogia: "from-ut-medium to-ut-light",
  lastekirurgia: "from-ut-navy to-ut-dark",
  uldkirurgia: "from-ut-light to-ut-medium",
  trauma: "from-ut-dark to-ut-navy",
};
