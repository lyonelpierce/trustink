import Logo from "./Logo";
import WidthWrapper from "./WidthWrapper";
import UserDropdown from "./UserDropdown";
import { Button } from "@/components/ui/button";
import { SignedOut, SignInButton, SignedIn } from "@clerk/nextjs";

const Navbar = () => {
  return (
    <div className="h-14 w-full border-b fixed top-0 z-50 backdrop-blur-xs">
      <WidthWrapper className="flex items-center justify-between h-full">
        <Logo isMainLogo={true} />
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <Button size="sm" className="h-10">
                Get Started
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserDropdown />
          </SignedIn>
        </div>
      </WidthWrapper>
    </div>
  );
};

export default Navbar;
