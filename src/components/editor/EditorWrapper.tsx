"use client";

import { useState } from "react";
import EditorNavbar from "./EditorNavbar";
import RecipientsForm from "./RecipientsForm";
import { Database } from "../../../database.types";
import Elements from "@/components/editor/elements/Elements";
import { LazyPDFViewerNoLoader } from "@/components/editor/LazyPDFViewer";

const EditorWrapper = ({
  document,
  fields,
  userInfo,
  documentUrl,
}: {
  document: Database["public"]["Tables"]["documents"]["Row"] & {
    documents_data: Database["public"]["Tables"]["documents_data"]["Row"][];
  };
  fields: (Database["public"]["Tables"]["fields"]["Row"] & {
    recipients: {
      id: string;
      email: string;
      color: string;
    };
  })[];
  userInfo: {
    first_name: string;
    last_name: string;
  };
  documentUrl: string;
}) => {
  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);

  return (
    <>
      <EditorNavbar
        documentName={document.name}
        documentId={document.id}
        userInfo={userInfo}
      />
      <div className="mx-auto bg-gray-50">
        <div className="flex gap-4 justify-center pt-20 relative p-4">
          <div className="sticky top-20 z-[50] min-w-96 max-w-96 h-min rounded-lg">
            <RecipientsForm documentId={document.id} />
          </div>
          <div className="w-full max-w-4xl">
            <LazyPDFViewerNoLoader
              documentData={document.documents_data[0]}
              onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
            />
          </div>
          <div className="sticky top-20 z-[50] min-w-96 max-w-96 h-min">
            <Elements
              fields={fields}
              documentId={document.id}
              isDocumentPdfLoaded={isDocumentPdfLoaded}
              documentUrl={documentUrl}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default EditorWrapper;
