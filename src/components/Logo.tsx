import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const Logo = ({
  isMainLogo,
  className,
}: {
  isMainLogo: boolean;
  className?: string;
}) => {
  return (
    <>
      {isMainLogo ? (
        <Link href="/">
          <h1 className={cn("font-semibold uppercase text-lg", className)}>
            Trust
            <span className="bg-black dark:bg-white p-0.5 text-white dark:text-black">
              Ink
            </span>
          </h1>
        </Link>
      ) : (
        <Link href="/">
          <h2 className={cn("font-semibold uppercase", className)}>Trustink</h2>
        </Link>
      )}
    </>
  );
};

export default Logo;
