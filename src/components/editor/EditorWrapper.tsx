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
  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);

  return (
    <>
      <EditorNavbar documentName={document.documents.name} />
      <div className="mx-auto max-w-[90rem] bg-gray-50">
        <div className="flex gap-4 justify-center pt-20 relative p-4">
          <div className="sticky top-20 z-[60] w-96 h-min rounded-lg">
            <RecipientsForm documentId={document.document_id} />
          </div>
          <div className="w-3/5">
            <LazyPDFViewerNoLoader
              documentData={document}
              onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
            />
          </div>
          <div className="sticky top-20 z-[60] w-96 h-min">
            <Elements
              fields={fields}
              documentId={document.document_id}
              isDocumentPdfLoaded={isDocumentPdfLoaded}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default EditorWrapper;
