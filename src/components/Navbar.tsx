"use client";

import Logo from "./Logo";
import WidthWrapper from "./WidthWrapper";
import UserDropdown from "./UserDropdown";
import { SignInButton } from "@clerk/nextjs";
import { links } from "@/constants/MenuItems";
import UnderlineText from "./ui/underlineText";
import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated } from "convex/react";

const Navbar = () => {
  return (
    <div className="h-14 w-full border-b fixed top-0 z-50 backdrop-blur-xl">
      <WidthWrapper className="flex items-center justify-between h-full">
        <div className="flex gap-8 items-center">
          <Logo isMainLogo={false} href="/" />
          <Authenticated>
            {links.map((link) => (
              <UnderlineText key={link.id} text={link.label} link={link.href} />
            ))}
          </Authenticated>
        </div>
        <div className="flex items-center gap-4">
          <Unauthenticated>
            <SignInButton>
              <Button size="sm" className="h-10">
                Get Started
              </Button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <UserDropdown />
          </Authenticated>
        </div>
      </WidthWrapper>
    </div>
  );
};

export default Navbar;
