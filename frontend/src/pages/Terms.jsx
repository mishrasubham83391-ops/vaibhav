import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SITE } from "@/config/site";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-navy text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-200 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="font-heading text-3xl md:text-5xl font-bold">Terms and Conditions</h1>
          <p className="text-white/70 mt-2">{SITE.instituteName}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 md:py-14 prose prose-slate">
        <ul className="space-y-3 text-ink/90 leading-relaxed text-[15px]">
          <Li>By using the website/app, you agree to follow its terms and policies.</Li>
          <Li>Content is for general information only and can change anytime.</Li>
          <Li>No guarantee is provided for accuracy or completeness of information.</Li>
          <Li>You use the website at your own risk; the company is not responsible for any loss.</Li>
          <Li>It is your responsibility to ensure services/products meet your needs.</Li>
          <Li>Website content (design, layout, graphics) is owned/licensed and cannot be copied.</Li>
          <Li>Unauthorized use may lead to legal action.</Li>
          <Li>External website links are for convenience; no responsibility for their content.</Li>
          <Li>You cannot link this website without prior permission.</Li>
          <Li>All disputes are governed by Indian law.</Li>
          <Li>Payments are processed only after payment authorization.</Li>
          <Li>The platform is for educational purposes only.</Li>
          <Li>No guarantee of income, job, or success.</Li>
          <Li>No refunds under any condition.</Li>
          <Li>Users are responsible for how they use the learned skills.</Li>
        </ul>
      </main>

      <footer className="bg-navy text-white/70 py-6 px-4 text-center text-sm">
        <Link to="/privacy-policy" className="text-gold hover:text-gold-200 mr-4">Privacy Policy</Link>
        <span>© 2026 {SITE.instituteName}</span>
      </footer>
    </div>
  );
}

function Li({ children }) {
  return (
    <li className="flex gap-3">
      <span className="text-gold-400 mt-1.5">◆</span>
      <span>{children}</span>
    </li>
  );
}
