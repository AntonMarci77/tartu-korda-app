import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { ProfileGate } from "@/components/ProfileGate";

export const metadata: Metadata = {
  title: "Korda",
  description:
    "Bilingual ET/EN study app — recall-first cards, spaced repetition, exam simulation and weak-spot drills for written exams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B365D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ProfileGate>
          <NavBar />
          <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 py-4 sm:py-8">
            {children}
          </main>
          <footer className="no-print mt-8 border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>Korda · for educational use</span>
              <span className="inline-flex items-center gap-1">
                Made with <span className="text-ut-orange" aria-label="love">♥</span> for Erik
              </span>
              <span>Anton Marci · 2025/2026</span>
            </div>
          </footer>
        </ProfileGate>
      </body>
    </html>
  );
}
