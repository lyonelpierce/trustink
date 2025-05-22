import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import EditorWrapper from "@/components/editor/EditorWrapper";
import { Id } from "../../../../../convex/_generated/dataModel";

const getDocument = async (id: string) => {
  try {
    const data = await preloadQuery(api.documents.getDocument, {
      documentId: id as Id<"documents">,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

const getUserInfo = async (userId: string) => {
  try {
    const data = await preloadQuery(api.users.getUserByClerkId, {
      clerkId: userId,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

const getLines = async (id: string) => {
  try {
    const data = await preloadQuery(api.lines.getLines, {
      document_id: id as Id<"documents">,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

const getFields = async (id: string) => {
  try {
    const data = await preloadQuery(api.fields.getFields, {
      document_id: id as Id<"documents">,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

const getRecipients = async (id: string) => {
  try {
    const data = await preloadQuery(api.recipients.getRecipients, {
      document_id: id as Id<"documents">,
    });

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

const SingleDocumentPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [document, userInfo, lines, fields, recipients] = await Promise.all([
    getDocument(id),
    getUserInfo(userId),
    getLines(id),
    getFields(id),
    getRecipients(id),
  ]);

  const value =
    typeof document._valueJSON === "string"
      ? JSON.parse(document._valueJSON)
      : document._valueJSON;

  return (
    <div className="bg-gray-50 min-h-screen">
      <EditorWrapper
        key={value._id}
        document={document}
        userInfo={userInfo}
        lines={lines}
        fields={fields}
        recipients={recipients}
      />
    </div>
  );
};

export default SingleDocumentPage;
