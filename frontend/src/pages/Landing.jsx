import { useState } from "react";
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

  const handleEnquire = (program) => {
    setPreselect(program);
  };

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
          onPreselectConsumed={() => setPreselect("")}
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
