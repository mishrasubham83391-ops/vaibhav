import { useCallback, useState } from "react";
import AnnouncementBar from "@/components/AnnouncementBar";
import CountdownTimer from "@/components/CountdownTimer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Courses from "@/components/Courses";
import Results from "@/components/Results";
import DemoForm from "@/components/DemoForm";
import Faculty from "@/components/Faculty";
import USP from "@/components/USP";
import Scholarship from "@/components/Scholarship";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SocialProofToast from "@/components/SocialProofToast";

export default function Landing() {
  const [preselect, setPreselect] = useState("");

  // Stable callback identities so child useEffect deps don't cause loops.
  const handleEnquire = useCallback((program) => {
    setPreselect(program);
    // Defensive direct scroll as a fallback in case the React state path
    // is delayed (e.g., heavy re-render). Safe optional chaining means
    // it's a no-op if the element isn't in the DOM yet.
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const target =
          document.getElementById("demo-form") ||
          document.getElementById("demo");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, []);

  const handlePreselectConsumed = useCallback(() => {
    setPreselect("");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <CountdownTimer />
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Courses onEnquire={handleEnquire} />
        <Results />
        <DemoForm
          preselectProgram={preselect}
          onPreselectConsumed={handlePreselectConsumed}
        />
        <Faculty />
        <USP />
        <Scholarship onEnquire={handleEnquire} />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <SocialProofToast />
    </div>
  );
}
