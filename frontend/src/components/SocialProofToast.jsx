import { useEffect, useRef, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";

// ---------------------------------------------------------------
// Local data — kept inside this component so it cannot be reused
// elsewhere by accident and so the file is self-contained.
// ---------------------------------------------------------------
const NAMES = [
  // Male
  "Aarav", "Arjun", "Rohit", "Vivek", "Karan", "Harsh", "Aman", "Rahul",
  "Vikram", "Yash", "Krish", "Manav", "Dhruv", "Parth", "Kunal", "Nirav",
  "Kartik", "Jay", "Raj", "Tanish",
  // Female
  "Priya", "Sneha", "Kavya", "Meera", "Riya", "Anjali", "Divya", "Pooja",
  "Isha", "Khushi", "Nidhi", "Janvi", "Hetvi", "Krisha", "Aaradhya",
  "Bhavya", "Rachna", "Shreya", "Tanvi", "Vidhi",
];

const CITIES = [
  "Navsari", "Bardoli", "Amalsad", "Bilimora", "Chikhli", "Gandevi", "Maroli",
];

const COURSES = [
  "JEE", "NEET", "Foundation", "9th", "10th Board",
  "11th Science", "12th Science (CBSE)", "12th Science (GSEB)",
];

const TIMES = ["just now", "a few seconds ago", "1 minute ago", "2 minutes ago"];

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick a fresh combination that doesn't fully match the previous one.
// We retry a few times so we never repeat name+city+course back-to-back.
function pickEntry(prevKey) {
  for (let i = 0; i < 8; i++) {
    const name = randItem(NAMES);
    const city = randItem(CITIES);
    const course = randItem(COURSES);
    const time = randItem(TIMES);
    const key = `${name}|${city}|${course}`;
    if (key !== prevKey) return { name, city, course, time, key };
  }
  // Fallback (extremely unlikely) — still return something valid.
  return {
    name: randItem(NAMES),
    city: randItem(CITIES),
    course: randItem(COURSES),
    time: randItem(TIMES),
    key: `${Date.now()}`,
  };
}

export default function SocialProofToast() {
  const [entry, setEntry] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const prevKeyRef = useRef("");
  const hideTimerRef = useRef(null);
  const nextTimerRef = useRef(null);

  useEffect(() => {
    if (dismissed) return undefined;

    const clearTimers = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (nextTimerRef.current) {
        clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }
    };

    const showOnce = () => {
      // Pick a non-repeating entry and reveal it with a fade-in.
      const next = pickEntry(prevKeyRef.current);
      prevKeyRef.current = next.key;
      setEntry(next);
      setVisible(true);

      // Auto-hide after 4 seconds, then schedule the next pop in 5–8 s.
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        const gap = 5000 + Math.floor(Math.random() * 3001); // 5000–8000 ms
        nextTimerRef.current = setTimeout(showOnce, gap);
      }, 4000);
    };

    // First popup appears 4 seconds after page load.
    nextTimerRef.current = setTimeout(showOnce, 4000);

    return clearTimers;
  }, [dismissed]);

  if (dismissed || !visible || !entry) return null;

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
          <span className="text-navy">{entry?.name}</span> from{" "}
          <span className="text-navy">{entry?.city}</span>
        </p>
        <p className="text-ink/70 mt-0.5">just registered for {entry?.course}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{entry?.time}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        type="button"
        className="absolute top-1 right-1 p-1 text-muted-foreground hover:text-ink"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
