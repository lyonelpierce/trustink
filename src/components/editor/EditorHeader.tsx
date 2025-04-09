import React from "react";
import Logo from "../Logo";
import { XIcon } from "lucide-react";
import { Button } from "../ui/button";

const EditorHeader = () => {
  return (
    <div className="w-screen fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 h-12 shadow-md flex items-center justify-between px-4">
      <Logo isMainLogo={false} />
      <Button variant="ghost" size="icon" className="">
        <XIcon className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default EditorHeader;
