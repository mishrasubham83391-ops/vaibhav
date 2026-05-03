import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Medal, Star, ChevronLeft, ChevronRight } from "lucide-react";

const PLACEHOLDER = [
  { id: "p1", name: "Student Topper 1", exam: "JEE Advanced", rank: "AIR 842", year: "2025", photo: "" },
  { id: "p2", name: "Student Topper 2", exam: "NEET UG", rank: "AIR 1204", year: "2025", photo: "" },
  { id: "p3", name: "Student Topper 3", exam: "Class 12 Boards", rank: "99.4%", year: "2024", photo: "" },
  { id: "p4", name: "Student Topper 4", exam: "Class 10 Boards", rank: "98.8%", year: "2024", photo: "" },
];

// How many cards are visible at once per breakpoint.
// Matches the previous static grid (2 cols mobile, 4 cols desktop) so the
// visual density is unchanged. Added a mid breakpoint for tablets.
function useVisibleCount() {
  const [n, setN] = useState(() => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 3;
    return 2;
  });
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setN(4);
      else if (window.innerWidth >= 640) setN(3);
      else setN(2);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return n;
}

function TopperCard({ t, idx }) {
  // IDENTICAL markup to the original static grid card.
  return (
    <div
      data-testid={`topper-card-${idx}`}
      className="bg-bg-alt rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition group h-full"
    >
      <div className="aspect-[4/5] bg-navy relative overflow-hidden">
        {t?.photo ? (
          <img
            src={t.photo}
            alt={t?.name || "Topper"}
            className="w-full h-full object-cover group-hover:scale-105 transition"
            onError={(e) => {
              // Fall back to the trophy icon if the URL is broken.
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.nextElementSibling;
              if (fb) fb.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-500 to-navy-700"
          style={{ display: t?.photo ? "none" : "flex" }}
        >
          <Trophy className="w-16 h-16 text-gold/80" />
        </div>
        <div className="absolute top-3 right-3 bg-gold text-navy text-xs font-bold px-2 py-1 rounded">
          {t?.year}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-gold-400 text-xs font-semibold mb-1">
          <Medal className="w-3.5 h-3.5" />
          {t?.exam}
        </div>
        <h3 className="font-heading font-semibold text-navy text-base leading-tight">
          {t?.name}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-sm">
          <Star className="w-3.5 h-3.5 text-gold-400 fill-gold" />
          <span className="font-semibold text-navy">{t?.rank}</span>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0); // current leftmost index
  const [paused, setPaused] = useState(false);

  const visible = useVisibleCount();
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/toppers");
        if (cancelled) return;
        const list = Array.isArray(res.data) && res.data.length ? res.data : PLACEHOLDER;
        setItems(list);
      } catch {
        if (!cancelled) setItems(PLACEHOLDER);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Duplicate the head of the list at the tail so the translate animation
  // always has enough cards to fill the viewport; this gives a seamless
  // wrap-around without an ugly jump back to 0.
  const display = useMemo(() => {
    if (!items.length) return [];
    const need = visible; // pad with up to `visible` cards at the end
    return items.concat(items.slice(0, need));
  }, [items, visible]);

  // Reset paging if the list shrinks/changes.
  useEffect(() => {
    setPage(0);
  }, [items.length, visible]);

  // Auto-advance every 4 seconds (right → left).
  useEffect(() => {
    if (!items.length || paused || items.length <= visible) return undefined;
    timerRef.current = setInterval(() => {
      setPage((p) => (p + 1) % items.length);
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, paused, visible]);

  const next = () => items.length && setPage((p) => (p + 1) % items.length);
  const prev = () => items.length && setPage((p) => (p - 1 + items.length) % items.length);

  // Slide width in % is 100/visible; translate is -page * (100/visible).
  const pct = 100 / Math.max(visible, 1);
  const translatePct = page * pct;

  return (
    <section id="results" className="section bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">
            Results Showcase
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            Our Toppers Speak Louder Than Claims
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            A glimpse of students who made the institute proud. Updated every result season.
          </p>
        </div>

        {/* Carousel: preserves the same 2/3/4-up density and card design. */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          data-testid="toppers-carousel"
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${translatePct}%)` }}
            >
              {display.map((t, idx) => (
                <div
                  key={`${t?.id || "p"}-${idx}`}
                  className="shrink-0 px-2 md:px-3"
                  style={{ width: `${pct}%` }}
                >
                  <TopperCard t={t} idx={idx} />
                </div>
              ))}
            </div>
          </div>

          {items.length > visible && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={prev}
                data-testid="toppers-prev"
                className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-3 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-navy hover:bg-gold hover:text-navy transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={next}
                data-testid="toppers-next"
                className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-3 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-navy hover:bg-gold hover:text-navy transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
