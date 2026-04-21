import { useState } from "react";
import { X } from "lucide-react";
import { SITE } from "@/config/site";

export default function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      data-testid="announcement-bar"
      className="bg-gold text-navy font-medium text-sm flex items-center justify-center px-4 py-2 relative"
    >
      <span className="text-center pr-8">{SITE.admissions.batchStartAnnouncement}</span>
      <button
        data-testid="announcement-close-btn"
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-navy/10 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
