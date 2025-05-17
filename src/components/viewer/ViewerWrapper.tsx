"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
// import { useAuth } from "@clerk/nextjs";
import { Database } from "../../../database.types";
import Elements from "@/components/viewer/elements/Elements";
import { LazyPDFViewerNoLoader } from "@/components/viewer/LazyPDFViewer";
import AIAgent from "./AIAgent";

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
  // const { userId } = useAuth();

  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);

  return (
    <>
      <div className={cn("bg-gray-50 w-full flex flex-row")}>
        <div className="flex gap-4 justify-center w-full pt-20 relative p-4 mr-[32rem]">
          <div className="flex-1 max-w-4xl">
            <LazyPDFViewerNoLoader
              document={document}
              onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
            />
          </div>
          <div className="sticky top-20 z-40 h-min">
            {isDocumentPdfLoaded && (
              <Elements
                fields={fields}
                documentId={document.id}
                isDocumentPdfLoaded={isDocumentPdfLoaded}
                recipients={document.recipients}
                selectedFieldId={selectedFieldId}
                setSelectedFieldId={setSelectedFieldId}
              />
            )}
          </div>
          <AIAgent
            documentId={document.id}
            chatMessages={chatMessages}
            setSelectedFieldId={setSelectedFieldId}
          />
        </div>
      </div>
    </>
  );
};

export default ViewerWrapper;
