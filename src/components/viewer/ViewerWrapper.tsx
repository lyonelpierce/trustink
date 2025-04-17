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
  chatMessages,
}: {
  document: Database["public"]["Tables"]["documents"]["Row"] & {
    documents_data: {
      data: string;
    };
    recipients: {
      id: string;
      email: string;
      color: string;
      signer_id: string;
    }[];
  };
  fields: (Database["public"]["Tables"]["fields"]["Row"] & {
    recipients: {
      id: string;
      email: string;
      color: string;
      signer_id: string;
    };
  })[];
  chatMessages: Database["public"]["Tables"]["chat_messages"]["Row"][];
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
              (recipient) => recipient.signer_id !== userId
            )
            ? "pr-0 mx-auto"
            : "mx-auto pr-[28rem]"
        )}
      >
        <div className="flex gap-4 justify-center w-full pt-20 relative p-4">
          <div className="flex-1 max-w-4xl">
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
        (recipient) => recipient.signer_id === userId
      ) && (
        <div className="fixed top-0 right-0 bg-white h-screen min-w-md max-w-md border-l pt-16 px-4">
          <ChatComponent documentId={document.id} chatMessages={chatMessages} />
        </div>
      )}
    </>
  );
};

export default ViewerWrapper;
