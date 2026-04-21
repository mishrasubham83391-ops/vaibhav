import { MessageCircle } from "lucide-react";
import { SITE } from "@/config/site";

export default function WhatsAppButton() {
  const link = `https://wa.me/${SITE.phoneDigits}?text=${encodeURIComponent(
    "Hi, I'd like to enquire about admissions at " + SITE.instituteName
  )}`;
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      data-testid="whatsapp-sticky-btn"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 bg-[#25D366] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition animate-pulse-gold"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
