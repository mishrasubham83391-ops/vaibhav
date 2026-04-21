import { SITE } from "@/config/site";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy text-white pt-12 pb-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-gold text-navy font-heading font-bold text-lg">
                P
              </span>
              <span className="font-heading font-bold text-lg">{SITE.instituteName}</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{SITE.tagline}</p>
            <p className="text-xs text-white/60 mt-3 leading-relaxed">{SITE.address}</p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-gold text-sm uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#courses" className="text-white/80 hover:text-gold">Courses</a></li>
              <li><a href="#results" className="text-white/80 hover:text-gold">Results</a></li>
              <li><a href="#demo" className="text-white/80 hover:text-gold">Demo Class</a></li>
              <li><a href="#faculty" className="text-white/80 hover:text-gold">Faculty</a></li>
              <li><a href="#contact" className="text-white/80 hover:text-gold">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-gold text-sm uppercase tracking-wider mb-3">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/terms-and-conditions" className="text-white/80 hover:text-gold" data-testid="footer-terms-link">Terms & Conditions</a></li>
              <li><a href="/privacy-policy" className="text-white/80 hover:text-gold" data-testid="footer-privacy-link">Privacy Policy</a></li>
              <li><a href="/admin" className="text-white/80 hover:text-gold text-xs" data-testid="footer-admin-link">Admin</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-gold text-sm uppercase tracking-wider mb-3">
              Admissions Helpline
            </h4>
            <a href={`tel:${SITE.phone}`} className="block text-white font-semibold mb-2 hover:text-gold">
              {SITE.phone}
            </a>
            <p className="text-xs text-white/60 leading-relaxed">
              Mon-Sat · Morning 7:00 AM – 12:00 PM · Evening 4:00 PM – 8:00 PM
            </p>
          </div>
        </div>

        <div className="pt-6 text-center text-sm text-white/60 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-gold fill-gold" /> by [{SITE.instituteName}]
          </div>
          <div>© 2026 {SITE.instituteName}. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
