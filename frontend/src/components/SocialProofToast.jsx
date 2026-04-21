import { useEffect, useState } from "react";
import { SOCIAL_PROOF } from "@/config/site";
import { X, CheckCircle2 } from "lucide-react";

export default function SocialProofToast() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const show = () => {
      setIdx((i) => (i + 1) % SOCIAL_PROOF.length);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    };
    const first = setTimeout(show, 8000);
    const id = setInterval(show, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [dismissed]);

  if (dismissed || !visible) return null;
  const s = SOCIAL_PROOF[idx];

  return (
    <div
      data-testid="social-proof-toast"
      className="fixed bottom-24 left-5 md:left-8 z-40 max-w-xs bg-white rounded-lg shadow-2xl border border-gray-200 p-3 pr-8 flex items-start gap-3 animate-slide-in-right"
    >
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      </div>
      <div className="text-xs text-ink">
        <p className="font-medium">
          <span className="text-navy">{s.name}</span> from <span className="text-navy">{s.city}</span>
        </p>
        <p className="text-ink/70 mt-0.5">just {s.action}</p>
        <p className="text-[10px] text-muted-foreground mt-1">a few minutes ago</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute top-1 right-1 p-1 text-muted-foreground hover:text-ink"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
