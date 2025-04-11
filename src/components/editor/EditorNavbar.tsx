"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import UnderlineText from "../ui/underlineText";
import { SendIcon, ChevronLeftIcon } from "lucide-react";

const EditorNavbar = () => {
  return (
    <div className="h-14 flex items-center justify-between px-4 fixed top-0 z-[60] w-full backdrop-blur-3xl border-b">
      <div className="flex items-center gap-2">
        <Link href="/documents" className="flex items-center gap-2">
          <ChevronLeftIcon />
        </Link>
        <UnderlineText
          text="Back to documents"
          link="/documents"
          className="flex items-center gap-2"
        />
      </div>
      <Button className="w-24">
        <SendIcon />
        Send
      </Button>
    </div>
  );
};

export default EditorNavbar;
