import Link from "next/link";
import { cn } from "@/lib/utils";
import WidthWrapper from "../WidthWrapper";
import { buttonVariants } from "../ui/button";

const Hero = () => {
  return (
    <WidthWrapper className="flex flex-col gap-4 items-center justify-center pt-20 h-screen">
      <h2 className="text-7xl font-semibold text-center">
        The{" "}
        <span className="dark:bg-white text-white bg-black dark:text-black p-0.5">
          next generation
        </span>{" "}
        of contracts
      </h2>
      <p className="text-2xl text-muted-foreground">
        smart, dynamic, and personalized.
      </p>

      <Link
        href="/sign-in"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        Get Started
      </Link>
    </WidthWrapper>
  );
};

export default Hero;
