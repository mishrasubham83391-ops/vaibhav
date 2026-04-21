import { SCHOLARSHIP_SLABS, SITE } from "@/config/site";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Scholarship({ onEnquire }) {
  return (
    <section id="scholarship" className="section bg-navy text-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Scholarship Program
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold">
            Earn a Scholarship — Up to 100% Fee Waiver
          </h2>
          <p className="text-white/80 mt-3 max-w-2xl mx-auto">
            Take our entrance test and get a scholarship based on your score.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur">
          <table className="w-full text-left" data-testid="scholarship-table">
            <thead className="bg-gold text-navy">
              <tr>
                <th className="py-3 px-4 md:px-6 text-sm md:text-base font-heading font-semibold">Score</th>
                <th className="py-3 px-4 md:px-6 text-sm md:text-base font-heading font-semibold">Scholarship</th>
              </tr>
            </thead>
            <tbody>
              {SCHOLARSHIP_SLABS.map((s, idx) => (
                <tr key={s.score} className={idx % 2 ? "bg-white/5" : ""}>
                  <td className="py-3 px-4 md:px-6 font-semibold text-gold">{s.score}</td>
                  <td className="py-3 px-4 md:px-6 text-white/90">{s.waiver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-white/80 mb-4">
            Next Scholarship Test: <span className="text-gold font-semibold">{SITE.admissions.nextScholarshipTest}</span>
          </p>
          <button
            onClick={() => onEnquire("Scholarship Test")}
            data-testid="scholarship-register-btn"
            className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-6 py-3 rounded-md hover:bg-gold-200 transition shadow-lg"
          >
            Register for Scholarship Test <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
