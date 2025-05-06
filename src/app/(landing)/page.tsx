import { cn } from "@/lib/utils";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import DemoSection from "@/components/landing/DemoSection";
import TechStackSection from "@/components/landing/TechStackSection";
import TractionSection from "@/components/landing/TractionSection";
import TeamSection from "@/components/landing/TeamSection";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <div>
      <div className="relative flex w-full items-center justify-center bg-white dark:bg-black">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:40px_40px]",
            "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
            "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
        <Hero />
      </div>
      <ProblemSection />
      <DemoSection />
      <TechStackSection />
      <TractionSection />
      <TeamSection />
      <CTASection />
    </div>
  );
}
