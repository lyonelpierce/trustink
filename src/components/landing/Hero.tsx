import { SignedOut, SignInButton } from "@clerk/nextjs";
import WidthWrapper from "../WidthWrapper";
import { Button } from "../ui/button";

const Hero = () => {
  return (
    <WidthWrapper className="flex flex-col gap-4 items-center justify-center pt-20 h-screen z-20">
      <h2 className="text-7xl font-semibold text-center">
        A new era of{" "}
        <span className="dark:bg-white text-white bg-black dark:text-black">
          digital agreements
        </span>
        .{" "}
      </h2>
      <p className="text-2xl text-muted-foreground">
        smart, dynamic, and personalized.
      </p>

      <SignedOut>
        <SignInButton>
          <Button size="lg" className="h-14 w-40 text-lg">
            Get Started
          </Button>
        </SignInButton>
      </SignedOut>
    </WidthWrapper>
  );
};

export default Hero;
