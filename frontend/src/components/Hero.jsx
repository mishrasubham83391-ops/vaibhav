import { SITE } from "@/config/site";
import CountUp from "./CountUp";
import { ArrowRight, BookOpen, PlayCircle, ExternalLink, GraduationCap } from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2000&q=80";

export default function Hero() {
  return (
    <section id="top" className="relative text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
        aria-hidden
      />
      <div className="absolute inset-0 hero-overlay" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs sm:text-sm text-gold border border-gold/30 mb-5">
            <GraduationCap className="w-4 h-4" />
            SSE · ICSE · GSEB · IIT-JEE · NEET · UCEED
          </div>
          <h1
            data-testid="hero-institute-name"
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
          >
            {SITE.instituteName}
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gold font-medium mb-8">
            {SITE.tagline}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-10">
            {SITE.heroStats.map((s) => (
              <div
                key={s.label}
                data-testid={`hero-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="bg-white/10 backdrop-blur border border-white/15 rounded-lg px-3 py-3 sm:py-4 text-center"
              >
                <div className="font-heading text-2xl sm:text-3xl font-bold text-gold">
                  <CountUp end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs sm:text-sm text-white/90 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href="#courses"
              data-testid="hero-cta-courses"
              className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-5 py-3 rounded-md hover:bg-gold-200 transition shadow-lg"
            >
              <BookOpen className="w-4 h-4" /> Explore Courses
            </a>
            <a
              href="#demo"
              data-testid="hero-cta-demo"
              className="inline-flex items-center gap-2 bg-white text-navy font-semibold px-5 py-3 rounded-md hover:bg-white/90 transition shadow-lg"
            >
              <PlayCircle className="w-4 h-4" /> Book Free Demo Class
            </a>
            <a
              href={SITE.externalLinks.onlineCourses}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-cta-online"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white/60 text-white font-semibold px-5 py-3 rounded-md hover:bg-white/10 transition"
            >
              Online Courses / Notes <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={SITE.externalLinks.pathshala}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-cta-pathshala"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white/60 text-white font-semibold px-5 py-3 rounded-md hover:bg-white/10 transition"
            >
              Pathshala Navsari <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Highlight banner */}
      <div className="relative bg-navy-700 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center text-sm md:text-base text-white">
          <span className="text-gold font-semibold">Admissions Open for 2026-27 Batch</span>{" "}
          <span className="text-white/80">| Limited Seats Available</span>
        </div>
      </div>
    </section>
  );
}
