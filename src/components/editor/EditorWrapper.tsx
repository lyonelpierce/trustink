"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Database } from "../../../database.types";
import { Textarea } from "@/components/ui/textarea";
import Elements from "@/components/editor/elements/Elements";
import { LazyPDFViewerNoLoader } from "@/components/editor/LazyPDFViewer";

const EditorWrapper = ({
  document,
  fields,
}: {
  document: Database["public"]["Tables"]["documents_data"]["Row"];
  fields: Database["public"]["Tables"]["fields"]["Row"][];
}) => {
  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);

  return (
    <div className="flex">
      <div className="w-1/6 fixed left-0 top-0 border-r h-full pt-14 z-50">
        <Accordion
          type="multiple"
          defaultValue={["fields"]}
          className="border-b"
        >
          <AccordionItem value="fields">
            <AccordionTrigger className="cursor-pointer px-4 hover:no-underline border-b rounded-none">
              Fields
            </AccordionTrigger>
            <AccordionContent className="p-4">
              <Elements
                fields={fields}
                documentId={document.document_id}
                isDocumentPdfLoaded={isDocumentPdfLoaded}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="advanced">
            <AccordionTrigger className="cursor-pointer px-4 hover:no-underline border-b rounded-none">
              Advanced
            </AccordionTrigger>
            <AccordionContent className="p-4">
              <div>Advanced</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="flex-1 flex items-center justify-center pt-20">
        <div className="w-1/6" />
        <div className="w-2/5">
          <LazyPDFViewerNoLoader
            documentData={document}
            onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
          />
        </div>
        <div className="w-1/6" />
      </div>
      <div className="fixed right-0 border-l h-full top-0 w-1/6 p-4 pt-20 z-50">
        <Textarea />
      </div>
    </div>
  );
};

export default EditorWrapper;
