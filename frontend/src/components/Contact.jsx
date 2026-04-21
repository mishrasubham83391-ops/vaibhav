import { SITE } from "@/config/site";
import { Phone, Mail, MapPin, Clock, Instagram, Youtube, Facebook, Send } from "lucide-react";

export default function Contact() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`;
  const waLink = `https://wa.me/${SITE.phoneDigits}?text=${encodeURIComponent(
    "Hi, I'd like to enquire about admissions at " + SITE.instituteName
  )}`;

  return (
    <section id="contact" className="section bg-bg-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">
            Get In Touch
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            Location & Contact
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 min-h-[320px]">
            <iframe
              data-testid="contact-map"
              src={mapSrc}
              title="Institute Location"
              className="w-full h-full min-h-[320px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-5">
            <Info icon={MapPin} label="Address">
              {SITE.address}
            </Info>
            <Info icon={Phone} label="Admissions Desk">
              <a data-testid="contact-phone" href={`tel:${SITE.phone.replace(/[^+0-9]/g, "")}`} className="text-navy hover:text-gold-400">
                {SITE.phone}
              </a>
            </Info>
            <Info icon={Send} label="WhatsApp">
              <a data-testid="contact-whatsapp" href={waLink} target="_blank" rel="noreferrer" className="text-navy hover:text-gold-400">
                Chat with Admissions Team
              </a>
            </Info>
            <Info icon={Mail} label="Email">
              <a href={`mailto:${SITE.email1}`} className="block text-navy hover:text-gold-400">{SITE.email1}</a>
              <a href={`mailto:${SITE.email2}`} className="block text-navy hover:text-gold-400">{SITE.email2}</a>
            </Info>
            <Info icon={Clock} label="Operating Hours">
              Mon–Sat: 7:00 AM – 8:00 PM<br />
              Sunday: Closed (Test Series on alternate Sundays)
            </Info>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Social href={SITE.social.instagram} icon={Instagram} label="instagram" />
              <Social href={SITE.social.youtube} icon={Youtube} label="youtube" />
              <Social href={SITE.social.facebook} icon={Facebook} label="facebook" />
              <Social href={SITE.social.telegram} icon={Send} label="telegram" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-navy/10 text-navy flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-sm">
        <div className="font-semibold text-navy mb-0.5">{label}</div>
        <div className="text-ink/80 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Social({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-testid={`social-${label}`}
      aria-label={label}
      className="w-10 h-10 rounded-full bg-bg-alt hover:bg-navy hover:text-gold text-navy flex items-center justify-center transition"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}
