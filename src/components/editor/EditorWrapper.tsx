"use client";

import { useState } from "react";
import EditorNavbar from "./EditorNavbar";
import { Database } from "../../../database.types";
import Elements from "@/components/editor/elements/Elements";
import { LazyPDFViewerNoLoader } from "@/components/editor/LazyPDFViewer";
import { Button } from "../ui/button";
import { UserPlus2Icon } from "lucide-react";
import { Input } from "../ui/input";

const EditorWrapper = ({
  document,
  fields,
}: {
  document: Database["public"]["Tables"]["documents_data"]["Row"] & {
    documents: {
      name: string;
    };
  };
  fields: Database["public"]["Tables"]["fields"]["Row"][];
}) => {
  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);

  return (
    <>
      <EditorNavbar documentName={document.documents.name} />
      <div className="mx-auto max-w-[90rem]">
        <div className="flex gap-4 justify-center pt-20 relative p-4">
          <div className="sticky top-20 z-[60] w-96 h-min rounded-lg">
            <div className="flex flex-col gap-2 border bg-white rounded-lg p-4">
              <p className="text-lg font-medium">Add Signers</p>
              <div className="flex flex-row gap-2">
                <Input placeholder="Email" className="w-3/5" />
                <Input placeholder="Name" className="w-2/5" />
              </div>
              <Button className="w-full rounded-lg">
                <UserPlus2Icon />
                Add Signer
              </Button>
            </div>
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
