import { useState } from "react";
import { COURSES, SITE } from "@/config/site";
import CountUp from "./CountUp";
import {
  Atom, Stethoscope, BookOpen, Clock, Target,
  GraduationCap, NotebookPen, Library, ChevronDown, ArrowRight,
} from "lucide-react";

const ICONS = {
  atom: Atom,
  stethoscope: Stethoscope,
  "book-open": BookOpen,
  clock: Clock,
  target: Target,
  "graduation-cap": GraduationCap,
  "notebook-pen": NotebookPen,
  library: Library,
};

function CourseCard({ course, onEnquire }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[course.icon] || BookOpen;
  const isGold = course.accent === "gold";

  return (
    <div
      data-testid={`course-card-${course.id}`}
      className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col ${
        isGold ? "course-border-gold" : "course-border-navy"
      }`}
    >
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
              isGold ? "bg-gold/15 text-navy" : "bg-navy/10 text-navy"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg sm:text-xl font-semibold text-navy leading-snug">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{course.duration}</p>
          </div>
        </div>

        <dl className="space-y-2 text-sm mb-4">
          <Row label="For" value={course.forWhom} />
          <Row label="Subjects" value={course.subjects} />
          <Row label="Batch" value={course.batch} />
          <Row label="Fee" value={course.fee} highlight />
        </dl>

        <button
          onClick={() => setOpen((v) => !v)}
          data-testid={`course-expand-${course.id}`}
          className="flex items-center gap-1 text-xs font-medium text-navy/70 hover:text-navy mb-3"
        >
          {open ? "Hide" : "View"} highlights
          <ChevronDown className={`w-3.5 h-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <ul className="text-sm space-y-1.5 mb-4 text-ink/80" data-testid={`course-highlights-${course.id}`}>
            {course.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span className="text-gold-400 mt-1">◆</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => onEnquire(course.title)}
          data-testid={`course-enquire-${course.id}`}
          data-course={course.title}
          data-course-id={course.id}
          className="mt-auto inline-flex items-center justify-center gap-2 w-full bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-600 transition group"
        >
          Enquire Now
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground shrink-0 min-w-[64px]">{label}:</dt>
      <dd className={`text-ink ${highlight ? "font-semibold text-navy" : ""}`}>{value}</dd>
    </div>
  );
}

export default function Courses({ onEnquire }) {
  return (
    <section id="courses" className="section bg-bg-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">Programs</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            Our Programs
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            From Class 1 foundations to JEE/NEET toppers — we prepare students at every stage.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {COURSES.map((c) => (
            <CourseCard key={c.id} course={c} onEnquire={onEnquire} />
          ))}
        </div>

        {/* Aggregate results */}
        <div className="mt-14 bg-navy rounded-2xl p-6 md:p-10 text-white">
          <h3 className="font-heading text-2xl md:text-3xl font-semibold text-center mb-8">
            Our Legacy of Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {SITE.aggregateStats.map((s) => (
              <div
                key={s.label}
                className="text-center p-4 bg-white/5 border border-white/10 rounded-lg"
                data-testid={`agg-stat-${s.label.slice(0, 10).toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="font-heading text-3xl md:text-4xl font-bold text-gold">
                  <CountUp end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-white/80 mt-1.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
