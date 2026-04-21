import { FACULTY } from "@/config/site";
import { User, Award } from "lucide-react";

export default function Faculty() {
  return (
    <section id="faculty" className="section bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">
            Our Mentors
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            Learn from the Best
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            All our faculty have years of experience with reputed backgrounds.
          </p>
        </div>

        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 overflow-x-auto md:overflow-visible gap-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar snap-x snap-mandatory">
          {FACULTY.map((f, idx) => (
            <div
              key={f.subject}
              data-testid={`faculty-card-${idx}`}
              className="shrink-0 w-[72%] sm:w-[46%] md:w-auto snap-start bg-bg-alt rounded-xl border border-gray-100 p-5 hover:shadow-lg transition"
            >
              <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center mb-4">
                <User className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-navy">
                {f.subject} Faculty
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-gold-400 font-medium mt-1">
                <Award className="w-3.5 h-3.5" />
                {f.years} experience
              </div>
              <p className="text-sm text-ink/70 mt-3 leading-relaxed">
                <span className="font-medium text-ink">Specialization:</span> {f.specialization}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All our faculty have lot of years of experience with reputed backgrounds.
        </p>
      </div>
    </section>
  );
}
