import Logo from "./Logo";
import WidthWrapper from "./WidthWrapper";
import UserDropdown from "./UserDropdown";
import { links } from "@/constants/MenuItems";
import UnderlineText from "./ui/underlineText";
import { Button } from "@/components/ui/button";
import { SignedOut, SignInButton, SignedIn } from "@clerk/nextjs";

const Navbar = () => {
  return (
    <div className="h-14 w-full border-b fixed top-0 z-50 backdrop-blur-xs">
      <WidthWrapper className="flex items-center justify-between h-full">
        <SignedIn>
          <div className="flex gap-8 items-center">
            <Logo isMainLogo={false} href="/" />
            {links.map((link) => (
              <UnderlineText key={link.id} text={link.label} link={link.href} />
            ))}
          </div>
        </SignedIn>
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
