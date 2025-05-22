"use client";

import { useState } from "react";
import EditorNavbar from "./EditorNavbar";
import RecipientsForm from "./RecipientsForm";
import { api } from "../../../convex/_generated/api";
import { Authenticated, Preloaded, usePreloadedQuery } from "convex/react";
import Elements from "@/components/editor/elements/Elements";
import { LazyPDFViewerNoLoader } from "@/components/editor/LazyPDFViewer";

const EditorWrapper = ({
  document,
  userInfo,
  lines,
  fields,
  recipients,
}: {
  document: Preloaded<typeof api.documents.getDocument>;
  userInfo: Preloaded<typeof api.users.getUserByClerkId>;
  lines: Preloaded<typeof api.lines.getLines>;
  fields: Preloaded<typeof api.fields.getFields>;
  recipients: Preloaded<typeof api.recipients.getRecipients>;
}) => {
  const [isDocumentPdfLoaded, setIsDocumentPdfLoaded] = useState(false);

  const preloadedDocument = usePreloadedQuery(document);
  const preloadedUserInfo = usePreloadedQuery(userInfo);
  const preloadedLines = usePreloadedQuery(lines);
  const preloadedFields = usePreloadedQuery(fields);
  const preloadedRecipients = usePreloadedQuery(recipients);

  console.log("PRELOADEDLINES", preloadedLines);
  console.log("PRELOADEDFIELDS", preloadedFields);

  return (
    <Authenticated>
      <EditorNavbar
        documentName={preloadedDocument.name}
        documentId={preloadedDocument._id}
        userInfo={preloadedUserInfo!}
      />
      <div className="mx-auto bg-gray-50">
        <div className="flex gap-4 justify-center pt-20 relative p-4">
          <div className="sticky top-20 z-[50] min-w-96 max-w-96 h-min rounded-lg">
            <RecipientsForm
              documentId={preloadedDocument._id}
              recipients={preloadedRecipients}
            />
          </div>
          <div className="w-full max-w-4xl">
            <LazyPDFViewerNoLoader
              documentUrl={preloadedDocument.url}
              onDocumentLoad={() => setIsDocumentPdfLoaded(true)}
            />
          </div>
          <div className="sticky top-20 z-[50] min-w-96 max-w-96 h-min">
            <Elements
              documentId={preloadedDocument._id}
              isDocumentPdfLoaded={isDocumentPdfLoaded}
              currentLines={preloadedLines}
              currentFields={preloadedFields}
              recipients={preloadedRecipients}
            />
          </div>
        </div>
      </div>
    </Authenticated>
  );
};

export default EditorWrapper;
