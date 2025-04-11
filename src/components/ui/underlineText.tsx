import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const UnderlineText = ({
  text,
  link,
  className,
}: {
  text: string;
  link: string;
  className?: string;
}) => {
  return (
    <Link href={link} className="group relative">
      <span className={cn("text-base font-medium", className)}>{text}</span>
      <div className="group-hover:w-full w-0 bg-black absolute h-0.5 mt-1 bottom-0 left-0 transition-all duration-300 -z-10" />
    </Link>
  );
};

export default UnderlineText;
