import Link from "next/link";
import Logo from "@/components/Logo";
import DocumentName from "./DocumentName";
import SendModal from "../viewer/SendModal";
import { ChevronLeftIcon } from "lucide-react";

const EditorNavbar = ({
  documentName,
  documentId,
  userInfo,
}: {
  documentName: string;
  documentId: string;
  userInfo: {
    first_name: string;
    last_name: string;
  };
}) => {
  return (
    <div className="h-14 flex items-center justify-between px-4 fixed top-0 z-[50] w-full backdrop-blur-3xl border-b bg-white/40">
      <div className="flex items-center justify-start gap-2 w-1/3">
        <Link href="/documents" className="flex items-center gap-2">
          <ChevronLeftIcon />
        </Link>
        <Logo isMainLogo={false} href="/documents" />
      </div>
      <div className="w-1/3 flex justify-center items-center">
        <DocumentName documentName={documentName} />
      </div>
      <div className="w-1/3 flex justify-end items-center">
        <SendModal
          documentName={documentName}
          documentId={documentId}
          userInfo={userInfo}
        />
      </div>
    </div>
  );
};

export default EditorNavbar;
