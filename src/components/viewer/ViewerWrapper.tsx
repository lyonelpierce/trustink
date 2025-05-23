"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import AIAgent from "./AIAgent";
import { api } from "../../../convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import Elements from "@/components/viewer/elements/Elements";
import { LazyPDFViewerNoLoader } from "@/components/viewer/LazyPDFViewer";
import { Id } from "../../../convex/_generated/dataModel";

const ViewerWrapper = ({
  document,
  lines,
  fields,
  highlights,
  chatMessages,
}: {
  document: Preloaded<typeof api.documents.getDocumentWithRecipients>;
  fields: Preloaded<typeof api.fields.getFields>;
  chatMessages: Preloaded<typeof api.messages.getChatMessages>;
  lines: Preloaded<typeof api.lines.getLines>;
  highlights: Preloaded<typeof api.highlights.getHighlights>;
}) => {
  const preloadedDocument = usePreloadedQuery(document);
  const preloadedLines = usePreloadedQuery(lines);
  const preloadedFields = usePreloadedQuery(fields);
  const preloadedChatMessages = usePreloadedQuery(chatMessages);
  const preloadedHighlights = usePreloadedQuery(highlights);

  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<Id<"fields"> | null>(
    null
  );

  return (
    <>
      <div className={cn("bg-gray-50 w-full flex flex-row")}>
        <div className="flex gap-4 justify-center w-full pt-20 relative p-4 mr-[32rem]">
          <div className="flex-1 max-w-4xl">
            <LazyPDFViewerNoLoader
              documentUrl={preloadedDocument.url}
              onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
            />
          </div>
          <div className="sticky top-20 z-40 h-min">
            {isDocumentPdfLoaded && (
              <Elements
                fields={preloadedFields}
                lines={preloadedLines}
                documentHighlights={preloadedHighlights}
                isDocumentPdfLoaded={isDocumentPdfLoaded}
                recipients={preloadedDocument.recipients}
                selectedFieldId={selectedFieldId}
                setSelectedFieldId={setSelectedFieldId}
              />
            )}
          </div>
          <AIAgent
            documentId={preloadedDocument._id}
            chatMessages={preloadedChatMessages}
            setSelectedFieldId={setSelectedFieldId}
          />
        </div>
      </div>
    </>
  );
};

export default ViewerWrapper;
