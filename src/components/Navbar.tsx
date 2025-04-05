import Logo from "./Logo";
import WidthWrapper from "./WidthWrapper";
import UserDropdown from "./UserDropdown";
import { Button } from "@/components/ui/button";
import { SignedOut, SignInButton, SignedIn } from "@clerk/nextjs";

const Navbar = () => {
  return (
    <div className="h-14 w-full border-b fixed top-0">
      <WidthWrapper className="flex items-center justify-between h-full">
        <Logo isMainLogo={true} />
        <SignedOut>
          <SignInButton>
            <Button>Get Started</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserDropdown />
        </SignedIn>
      </WidthWrapper>
    </div>
  );
};

export default Navbar;
