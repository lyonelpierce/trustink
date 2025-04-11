import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const Logo = ({
  isMainLogo,
  className,
  href,
}: {
  isMainLogo: boolean;
  className?: string;
  href?: string;
}) => {
  return (
    <>
      {isMainLogo ? (
        <Link href={`${process.env.NEXT_PUBLIC_BASE_URL}`}>
          <h1 className={cn("font-semibold uppercase text-lg", className)}>
            Trust
            <span className="bg-black dark:bg-white p-0.5 text-white dark:text-black">
              Ink
            </span>
          </h1>
        </Link>
      ) : (
        <Link href={href ? href : `${process.env.NEXT_PUBLIC_BASE_URL}`}>
          <h2 className={cn("font-semibold uppercase text-lg", className)}>
            Trust
            <span className="bg-black dark:bg-white p-0.5 text-white dark:text-black">
              Ink
            </span>
          </h2>
        </Link>
      )}
    </>
  );
};

export default Logo;
