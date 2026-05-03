import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SITE } from "@/config/site";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const INITIAL = {
  student_name: "",
  parent_name: "",
  phone: "",
  email: "",
  student_class: "",
  program: "",
  preferred_date: "",
  preferred_timing: "",
  source: "",
  questions: "",
  consent: false,
};

export default function DemoForm({ preselectProgram, onPreselectConsumed }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (preselectProgram) {
      // Update the program field via React state (preferred path).
      setForm((f) => ({ ...f, program: preselectProgram }));
      onPreselectConsumed?.();
      // Smoothly scroll to the form. We try the new "demo-form" anchor
      // first, fall back to the legacy "demo" section id, and finally
      // hash-based navigation. Optional chaining keeps it safe.
      const id = setTimeout(() => {
        const target =
          document.getElementById("demo-form") ||
          document.getElementById("demo");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(id);
    }
  }, [preselectProgram, onPreselectConsumed]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.student_name.trim()) e.student_name = "Required";
    if (!form.parent_name.trim()) e.parent_name = "Required";
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone";
    if (!form.student_class) e.student_class = "Required";
    if (!form.program) e.program = "Required";
    if (!form.preferred_date) e.preferred_date = "Required";
    else {
      const d = new Date(form.preferred_date);
      if (d.getDay() === 0) e.preferred_date = "Sundays not allowed";
      if (d < new Date(new Date().toDateString())) e.preferred_date = "Pick a future date";
    }
    if (!form.preferred_timing) e.preferred_timing = "Required";
    if (!form.source) e.source = "Required";
    if (!form.consent) e.consent = "Please accept the consent, Terms & Conditions, and Privacy Policy to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/bookings", form);
      const waMsg =
        `New Demo Booking: Student: ${form.student_name}, Class: ${form.student_class}, ` +
        `Program: ${form.program}, Date: ${form.preferred_date}, Parent Phone: +91${form.phone}`;
      const waUrl = `https://wa.me/${SITE.phoneDigits}?text=${encodeURIComponent(waMsg)}`;
      setSuccessOpen(true);
      toast.success("Demo Class Booked!", {
        description: "We'll confirm your slot via WhatsApp within 4 hours.",
        duration: 5000,
      });
      setForm(INITIAL);
      // Open WhatsApp in background tab
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Something went wrong", {
        description: err?.response?.data?.detail || "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const min = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <section id="demo" className="section bg-bg-alt">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">
            100% Free · No Registration Fee
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            Attend a Free Demo Class
          </h2>
          <p className="text-muted-foreground mt-3">
            Experience our teaching method before you decide. Zero pressure, zero cost.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          id="demo-form"
          data-testid="demo-booking-form"
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 md:p-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Student Name" required error={errors.student_name}>
              <input
                data-testid="field-student-name"
                value={form.student_name}
                onChange={(e) => set("student_name", e.target.value)}
                className="input"
                placeholder="Full name"
              />
            </Field>
            <Field label="Parent/Guardian Name" required error={errors.parent_name}>
              <input
                data-testid="field-parent-name"
                value={form.parent_name}
                onChange={(e) => set("parent_name", e.target.value)}
                className="input"
                placeholder="Parent name"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone Number" required error={errors.phone}>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm text-ink/70">
                  +91
                </span>
                <input
                  data-testid="field-phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="input rounded-l-none"
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                />
              </div>
            </Field>
            <Field label="Email (optional)" error={errors.email}>
              <input
                data-testid="field-email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="input"
                placeholder="you@example.com"
                type="email"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Student's Current Class" required error={errors.student_class}>
              <select
                data-testid="field-student-class"
                value={form.student_class}
                onChange={(e) => set("student_class", e.target.value)}
                className="input"
              >
                <option value="">Select class</option>
                {SITE.classDropdown.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Interested Program" required error={errors.program}>
              <select
                data-testid="field-program"
                value={form.program}
                onChange={(e) => set("program", e.target.value)}
                className="input"
              >
                <option value="">Select program</option>
                {SITE.programsDropdown.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Preferred Demo Date" required error={errors.preferred_date}>
              <input
                data-testid="field-date"
                type="date"
                min={min}
                value={form.preferred_date}
                onChange={(e) => set("preferred_date", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Preferred Batch Timing" required error={errors.preferred_timing}>
              <select
                data-testid="field-timing"
                value={form.preferred_timing}
                onChange={(e) => set("preferred_timing", e.target.value)}
                className="input"
              >
                <option value="">Select timing</option>
                {SITE.timings.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="How did you hear about us?" required error={errors.source}>
            <select
              data-testid="field-source"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className="input"
            >
              <option value="">Select source</option>
              {SITE.sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Any specific questions? (optional)">
            <textarea
              data-testid="field-questions"
              value={form.questions}
              onChange={(e) => set("questions", e.target.value)}
              rows={3}
              className="input"
              placeholder="Anything you'd like us to know…"
            />
          </Field>

          {/* Consent */}
          <div
            className={`rounded-md p-3 border ${
              errors.consent ? "border-red-300 bg-red-50" : "border-gray-200 bg-bg-alt/60"
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                data-testid="field-consent"
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set("consent", e.target.checked)}
                className="mt-1 w-5 h-5 accent-navy cursor-pointer"
              />
              <span className="text-sm text-ink/90 leading-relaxed">
                I consent to receiving RCS, WhatsApp, Email or SMS from {SITE.instituteName} & I have reviewed and agreed to the{" "}
                <a href="/terms-and-conditions" target="_blank" className="text-navy underline font-medium">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" target="_blank" className="text-navy underline font-medium">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.consent && (
              <p
                data-testid="consent-error"
                className="flex items-center gap-1.5 text-xs text-red-600 mt-2 ml-8"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.consent}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="demo-submit-btn"
            className="w-full inline-flex items-center justify-center gap-2 bg-gold text-navy font-semibold py-3 rounded-md hover:bg-gold-200 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Booking…
              </>
            ) : (
              "Book My Free Demo Class"
            )}
          </button>

          <div className="grid sm:grid-cols-3 gap-2 pt-2">
            <Badge>No registration fee for demo</Badge>
            <Badge>Study material provided</Badge>
            <Badge>Parents welcome to attend</Badge>
          </div>
        </form>
      </div>

      {successOpen && (
        <div
          data-testid="success-modal"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-up"
          onClick={() => setSuccessOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-navy mb-2">Demo Class Booked!</h3>
            <p className="text-ink/80 mb-6">
              We'll confirm your slot via WhatsApp within 4 hours.
            </p>
            <button
              onClick={() => setSuccessOpen(false)}
              data-testid="success-close-btn"
              className="bg-navy text-white px-6 py-2.5 rounded-md font-medium hover:bg-navy-600"
            >
              Great, thanks!
            </button>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 0.375rem;
          padding: 0.65rem 0.75rem;
          font-size: 0.95rem;
          color: #222;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          outline: none;
          border-color: #1B2A4A;
          box-shadow: 0 0 0 3px rgba(27,42,74,0.12);
        }
      `}</style>
    </section>
  );
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </label>
  );
}

function Badge({ children }) {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-navy bg-gold/15 px-3 py-2 rounded-md">
      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
