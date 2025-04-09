import Logo from "../Logo";
import Link from "next/link";
import WidthWrapper from "../WidthWrapper";
import UserDropdown from "../UserDropdown";
import { ModeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import { SignedOut, SignInButton, SignedIn } from "@clerk/nextjs";

const links = [
  {
    id: "1",
    label: "Documents",
    href: "/documents",
  },
  {
    id: "2",
    label: "Templates",
    href: "/templates",
  },
];
const DashboardNavbar = () => {
  return (
    <div className="h-14 w-full border-b fixed top-0 z-50 backdrop-blur-2xl">
      <WidthWrapper className="flex items-center justify-between h-full">
        <div className="flex gap-8 items-center">
          <Logo isMainLogo={true} />
          {links.map((link) => (
            <div key={link.id} className="group relative">
              <Link href={link.href} className="text-base font-medium">
                {link.label}
              </Link>
              <div className="group-hover:w-full w-0 bg-black absolute h-0.5 bottom-0 left-0 transition-all duration-300 -z-10" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle rounded />
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

export default DashboardNavbar;
