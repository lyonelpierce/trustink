"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { XIcon, SendIcon } from "lucide-react";

const EditorNavbar = () => {
  return (
    <div className="h-14 flex items-center justify-between px-4 fixed top-0 z-[60] w-full backdrop-blur-3xl border-b">
      <Link href="/documents" className="flex items-center gap-2">
        <XIcon />
        Back to documents
      </Link>
      <Button className="w-24">
        <SendIcon />
        Send
      </Button>
    </div>
  );
};

export default EditorNavbar;
