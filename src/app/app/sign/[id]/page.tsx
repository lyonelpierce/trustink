import { notFound } from "next/navigation";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import ViewerWrapper from "@/components/viewer/ViewerWrapper";
import { Id } from "../../../../../convex/_generated/dataModel";

const getDocument = async (id: string) => {
  // Get the document and recipients
  try {
    const data = await preloadQuery(api.documents.getDocumentWithRecipients, {
      documentId: id as Id<"documents">,
    });

    if (!data) {
      notFound();
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

export const generateMetadata = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;

  const document = await getDocument(id);

  const value =
    typeof document._valueJSON === "string"
      ? JSON.parse(document._valueJSON)
      : document._valueJSON;

  return {
    title: value.name,
    description: value.name,
  };
};

const getDocumentFields = async (id: string) => {
  const data = await preloadQuery(api.fields.getFields, {
    document_id: id as Id<"documents">,
  });

  return data;
};

const getDocumentLines = async (id: string) => {
  const data = await preloadQuery(api.lines.getLines, {
    document_id: id as Id<"documents">,
  });

  return data;
};

const getDocumentHighlights = async (id: string) => {
  const data = await preloadQuery(api.highlights.getHighlights, {
    document_id: id as Id<"documents">,
  });

  return data;
};

const getChatMessages = async (id: string) => {
  try {
    const data = await preloadQuery(api.messages.getChatMessages, {
      document_id: id as Id<"documents">,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

const SignPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;

  // Fetch all data in parallel
  const [document, fields, chatMessages, lines, highlights] = await Promise.all(
    [
      getDocument(id),
      getDocumentFields(id),
      getChatMessages(id),
      getDocumentLines(id),
      getDocumentHighlights(id),
    ]
  );

  return (
    <div className="bg-gray-50">
      <ViewerWrapper
        document={document}
        lines={lines}
        fields={fields}
        highlights={highlights}
        chatMessages={chatMessages}
      />
    </div>
  );
};

export default SignPage;
