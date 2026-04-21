import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SITE } from "@/config/site";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-navy text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-200 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="font-heading text-3xl md:text-5xl font-bold">Privacy Policy</h1>
          <p className="text-white/70 mt-2">{SITE.instituteName}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 md:py-14 text-ink/90 leading-relaxed text-[15px]">
        <Block title="Privacy Policy — Summary">
          <Li>By using this website/app, you agree to the collection and use of your data as per this policy.</Li>
        </Block>

        <Block title="Data Collected">
          <Li><b>Personal Data:</b> Name, Email, Phone Number</Li>
          <Li><b>Usage Data:</b> IP address, browser, device info, time spent</Li>
          <Li><b>Cookies:</b> Used for tracking, preferences, and improving user experience</Li>
        </Block>

        <Block title="How Data is Used">
          <Li>To provide and improve services</Li>
          <Li>To manage user accounts</Li>
          <Li>To contact users (Email, SMS, Calls)</Li>
          <Li>To send updates, offers, and notifications</Li>
          <Li>For analysis, performance, and security</Li>
        </Block>

        <Block title="Data Sharing">
          <Li>Shared with service providers (analytics, ads, payments)</Li>
          <Li>Shared with business partners or affiliates</Li>
          <Li>May be transferred during business deals (merger/sale)</Li>
          <Li>Shared with legal authorities if required by law</Li>
        </Block>

        <Block title="Data Storage & Security">
          <Li>Data is stored only as long as necessary</Li>
          <Li>Security measures are applied, but 100% safety is not guaranteed</Li>
          <Li>Data may be stored or processed in different locations</Li>
        </Block>

        <Block title="User Rights">
          <Li>Users can accept or reject cookies</Li>
          <Li>Users are responsible for data shared publicly</Li>
          <Li>Users should review the policy regularly for updates</Li>
        </Block>

        <Block title="Children Policy">
          <Li>Not intended for users under 13 years</Li>
          <Li>Any such data will be removed if identified</Li>
        </Block>

        <Block title="External Links">
          <Li>Third-party links may be present</Li>
          <Li>We are not responsible for their content or policies</Li>
        </Block>

        <Block title="Policy Updates">
          <Li>Policy may be updated anytime</Li>
          <Li>Changes will be notified via website or email</Li>
        </Block>

        <Block title="Final">
          <Li>By continuing to use the website/app, you agree to this Privacy Policy.</Li>
        </Block>
      </main>

      <footer className="bg-navy text-white/70 py-6 px-4 text-center text-sm">
        <Link to="/terms-and-conditions" className="text-gold hover:text-gold-200 mr-4">Terms & Conditions</Link>
        <span>© 2026 {SITE.instituteName}</span>
      </footer>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section className="mb-7">
      <h2 className="font-heading text-xl md:text-2xl font-semibold text-navy mb-3">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </section>
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
