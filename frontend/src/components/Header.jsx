import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE } from "@/config/site";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_deploy-ready-190/artifacts/zdhc45i2_WhatsApp%20Image%202026-04-11%20at%2010.01.06%20AM.jpeg";

const navLinks = [
  { href: "#courses", label: "Courses" },
  { href: "#results", label: "Results" },
  { href: "#demo", label: "Demo Class" },
  { href: "#faculty", label: "Faculty" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-header"
      className={`sticky top-0 z-40 transition-all bg-white border-b ${
        scrolled ? "border-gray-200 shadow-sm" : "border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2.5 md:py-3">
        <a href="#top" className="flex items-center gap-3" data-testid="header-logo">
          <img
            src={LOGO_URL}
            alt={`${SITE.instituteName} logo`}
            className="h-10 md:h-[45px] w-auto object-contain"
            style={{ mixBlendMode: "multiply" }}
          />
          <span className="font-heading font-bold text-sm sm:text-base md:text-lg text-navy leading-tight">
            {SITE.instituteName}
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-${l.label.toLowerCase().replace(" ", "-")}`}
              className="text-sm font-medium text-navy hover:text-gold-400 transition"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#demo"
            data-testid="header-book-demo-btn"
            className="bg-gold text-navy font-semibold px-4 py-2 rounded-md text-sm hover:bg-gold-200 transition shadow"
          >
            Book Demo
          </a>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded text-navy"
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg" data-testid="mobile-menu">
          <div className="flex flex-col p-4 gap-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-navy py-2 border-b border-gray-100 font-medium"
                data-testid={`mobile-nav-${l.label.toLowerCase().replace(" ", "-")}`}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#demo"
              onClick={() => setOpen(false)}
              className="bg-gold text-navy font-semibold px-4 py-2.5 rounded-md text-center"
              data-testid="mobile-book-demo-btn"
            >
              Book Demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
