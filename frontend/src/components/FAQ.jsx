import { FAQS } from "@/config/site";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <section id="faq" className="section bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gold-400 font-semibold uppercase tracking-widest text-xs mb-2">
            Quick Answers
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-2" data-testid="faq-accordion">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              data-testid={`faq-item-${i}`}
              className="border border-gray-200 rounded-lg px-4 md:px-5 bg-bg-alt/50"
            >
              <AccordionTrigger className="text-left font-medium text-navy text-sm md:text-base hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-ink/80 text-sm leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
