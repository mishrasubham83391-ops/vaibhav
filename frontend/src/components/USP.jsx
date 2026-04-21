import { USPS } from "@/config/site";
import {
  ClipboardCheck, Users, MessageCircle, HelpCircle, BookMarked, Award,
} from "lucide-react";

const ICONS = {
  "clipboard-check": ClipboardCheck,
  users: Users,
  "message-circle": MessageCircle,
  "help-circle": HelpCircle,
  "book-marked": BookMarked,
  award: Award,
};

export default function USP() {
  return (
    <section id="usp" className="section bg-bg-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">
            Why Choose Us
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            The Pinnacle Advantage
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {USPS.map((u, idx) => {
            const Icon = ICONS[u.icon] || Award;
            return (
              <div
                key={u.title}
                data-testid={`usp-card-${idx}`}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/15 text-navy flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-navy mb-2">{u.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{u.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
