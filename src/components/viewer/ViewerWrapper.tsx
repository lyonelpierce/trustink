"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Database } from "../../../database.types";
import Elements from "@/components/viewer/elements/Elements";
import { LazyPDFViewerNoLoader } from "@/components/viewer/LazyPDFViewer";

const ViewerWrapper = ({
  document,
  fields,
}: {
  document: Database["public"]["Tables"]["documents_data"]["Row"] & {
    documents: {
      name: string;
    };
  };
  fields: (Database["public"]["Tables"]["fields"]["Row"] & {
    recipients: {
      id: string;
      email: string;
      color: string;
    };
  })[];
}) => {
  const { userId } = useAuth();

  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);

  return (
    <>
      <div className="mx-auto max-w-[90rem] bg-gray-50">
        <div className="flex gap-4 justify-center pt-20 relative p-4">
          <div className="w-3/5">
            <LazyPDFViewerNoLoader
              documentData={document}
              onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
            />
          </div>
          <div className="sticky top-20 z-40 w-96 h-min">
            {isDocumentPdfLoaded && (
              <Elements
                fields={fields}
                documentId={document.document_id}
                isDocumentPdfLoaded={isDocumentPdfLoaded}
              />
            )}
          </div>
        </div>
      </div>
      {userId === document.user_id && (
        <div className="fixed top-0 right-0 bg-white h-screen w-[30rem] border-l pt-16 px-4">
          <p>Hello</p>
        </div>
      )}
    </>
  );
};

export default ViewerWrapper;
