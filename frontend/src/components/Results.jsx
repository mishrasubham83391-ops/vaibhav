import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Medal, Star } from "lucide-react";

const PLACEHOLDER = [
  { id: "p1", name: "Student Topper 1", exam: "JEE Advanced", rank: "AIR 842", year: "2025", photo: "" },
  { id: "p2", name: "Student Topper 2", exam: "NEET UG", rank: "AIR 1204", year: "2025", photo: "" },
  { id: "p3", name: "Student Topper 3", exam: "Class 12 Boards", rank: "99.4%", year: "2024", photo: "" },
  { id: "p4", name: "Student Topper 4", exam: "Class 10 Boards", rank: "98.8%", year: "2024", photo: "" },
];

export default function Results() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/toppers");
        setItems(Array.isArray(res.data) && res.data.length ? res.data : PLACEHOLDER);
      } catch {
        setItems(PLACEHOLDER);
      }
    })();
  }, []);

  return (
    <section id="results" className="section bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">
            Results Showcase
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            Our Toppers Speak Louder Than Claims
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            A glimpse of students who made the institute proud. Updated every result season.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {items.slice(0, 8).map((t, idx) => (
            <div
              key={t.id}
              data-testid={`topper-card-${idx}`}
              className="bg-bg-alt rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition group"
            >
              <div className="aspect-[4/5] bg-navy relative overflow-hidden">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-500 to-navy-700">
                    <Trophy className="w-16 h-16 text-gold/80" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-gold text-navy text-xs font-bold px-2 py-1 rounded">
                  {t.year}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-gold-400 text-xs font-semibold mb-1">
                  <Medal className="w-3.5 h-3.5" />
                  {t.exam}
                </div>
                <h3 className="font-heading font-semibold text-navy text-base leading-tight">
                  {t.name}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <Star className="w-3.5 h-3.5 text-gold-400 fill-gold" />
                  <span className="font-semibold text-navy">{t.rank}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
