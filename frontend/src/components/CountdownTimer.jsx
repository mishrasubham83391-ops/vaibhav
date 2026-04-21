import { useEffect, useState } from "react";
import { SITE } from "@/config/site";

function diff(target) {
  const now = new Date();
  const end = new Date(target);
  const ms = end - now;
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
    done: false,
  };
}

export default function CountdownTimer() {
  const [t, setT] = useState(diff(SITE.admissions.closingDate));
  useEffect(() => {
    const id = setInterval(() => setT(diff(SITE.admissions.closingDate)), 1000);
    return () => clearInterval(id);
  }, []);

  if (t.done) return null;
  return (
    <div
      data-testid="countdown-timer"
      className="bg-navy text-white text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-4 px-4 py-1.5"
    >
      <span className="text-gold font-semibold uppercase tracking-wider">Admissions Closing In</span>
      <div className="flex gap-1.5 sm:gap-2 font-mono">
        <TBox n={t.d} l="D" />
        <TBox n={t.h} l="H" />
        <TBox n={t.m} l="M" />
        <TBox n={t.s} l="S" />
      </div>
    </div>
  );
}

function TBox({ n, l }) {
  return (
    <span className="bg-white/10 rounded px-1.5 py-0.5 min-w-[32px] text-center">
      <span className="font-bold">{String(n).padStart(2, "0")}</span>
      <span className="text-gold/80 ml-0.5">{l}</span>
    </span>
  );
}
