import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseAdmin";
import { SupabaseClient } from "@supabase/supabase-js";
import ViewerWrapper from "@/components/viewer/ViewerWrapper";

const getDocument = async (supabase: SupabaseClient, id: string) => {
  // Get the document and recipients
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select(
      `
      *,
      recipients (
        id,
        email,
        color,
        user_id
      )
    `
    )
    .eq("id", id)
    .single();

  if (!document || document.status === "draft") {
    notFound();
  }

  if (documentError) {
    console.error(documentError);
    throw new Error(documentError.message);
  }

  if (!document) {
    notFound();
  }

  // Get the documents_data
  const { data: documentData, error: dataError } = await supabase
    .from("documents_data")
    .select("data")
    .eq("document_id", id)
    .single();

  if (dataError) {
    console.error(dataError);
    throw new Error(dataError.message);
  }

  return {
    ...document,
    documents_data: documentData,
  };
};

export const generateMetadata = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;

  const supabase = await createClient();
  const document = await getDocument(supabase, id);

  return {
    title: document.name,
    description: document.name,
  };
};

const getDocumentFields = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from("fields")
    .select(
      `
      *,
      recipients!fields_recipient_id_fkey (
        id,
        email,
        color
      )
    `
    )
    .eq("document_id", id);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  return data;
};

const getChatMessages = async (supabase: SupabaseClient, id: string) => {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("document_id", id);

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

const SignPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;

  const supabase = await createClient();

  const document = await getDocument(supabase, id);
  const fields = await getDocumentFields(supabase, id);
  const chatMessages = await getChatMessages(supabase, id);

  return (
    <div className="bg-gray-50">
      <ViewerWrapper
        document={document}
        fields={fields}
        chatMessages={chatMessages}
      />
    </div>
  );
};

export default SignPage;
