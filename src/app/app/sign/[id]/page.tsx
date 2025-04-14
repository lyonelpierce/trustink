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
        account_id
      )
    `
    )
    .eq("id", id)
    .single();

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

const SignPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;

  const supabase = await createClient();

  const document = await getDocument(supabase, id);
  const fields = await getDocumentFields(supabase, id);

  return (
    <div className="bg-gray-50">
      <ViewerWrapper document={document} fields={fields} />
    </div>
  );
};

export default SignPage;
