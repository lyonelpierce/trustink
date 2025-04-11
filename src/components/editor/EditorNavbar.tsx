import Logo from "../Logo";
import Link from "next/link";
import { Button } from "../ui/button";
import DocumentName from "./DocumentName";
import { SendIcon, ChevronLeftIcon } from "lucide-react";

const EditorNavbar = ({ documentName }: { documentName: string }) => {
  return (
    <div className="h-14 flex items-center justify-between px-4 fixed top-0 z-[60] w-full backdrop-blur-3xl border-b">
      <div className="flex items-center gap-2">
        <Link href="/documents" className="flex items-center gap-2">
          <ChevronLeftIcon />
        </Link>
        <Logo isMainLogo={false} />
      </div>
      <DocumentName documentName={documentName} />
      <Button className="w-24">
        <SendIcon />
        Send
      </Button>
    </div>
  );
};

export default EditorNavbar;
