"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Database } from "../../../database.types";
import Elements from "@/components/viewer/elements/Elements";
import ChatComponent from "@/components/viewer/chat/ChatComponent";
import { LazyPDFViewerNoLoader } from "@/components/viewer/LazyPDFViewer";

const ViewerWrapper = ({
  document,
  fields,
}: {
  document: Database["public"]["Tables"]["documents"]["Row"] & {
    documents_data: {
      data: string;
    };
    recipients: {
      id: string;
      email: string;
      color: string;
      account_id: string;
    }[];
  };
  fields: (Database["public"]["Tables"]["fields"]["Row"] & {
    recipients: {
      id: string;
      email: string;
      color: string;
      account_id: string;
    };
  })[];
}) => {
  const { userId } = useAuth();

  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);

  return (
    <>
      <div
        className={cn(
          "bg-gray-50 w-full",
          !userId ||
            document.recipients.some(
              (recipient) => recipient.account_id !== userId
            )
            ? "pr-0 mx-auto"
            : "mx-auto pr-96"
        )}
      >
        <div className="flex gap-4 justify-center w-full pt-20 relative p-4">
          <div className="w-[46%]">
            <LazyPDFViewerNoLoader
              document={document}
              onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
            />
          </div>
          <div className="sticky top-20 z-40 min-w-96 h-min">
            {isDocumentPdfLoaded && (
              <Elements
                fields={fields}
                documentId={document.id}
                isDocumentPdfLoaded={isDocumentPdfLoaded}
                recipients={document.recipients}
              />
            )}
          </div>
        </div>
      </div>
      {document.recipients.some(
        (recipient) => recipient.account_id === userId
      ) && (
        <div className="fixed top-0 right-0 bg-white h-screen w-96 border-l pt-16 px-4">
          <ChatComponent documentId={document.id} />
        </div>
      )}
    </>
  );
};

export default ViewerWrapper;
