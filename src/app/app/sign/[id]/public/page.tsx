import { SupabaseClient } from "@supabase/supabase-js";
import ViewerWrapper from "@/components/viewer/ViewerWrapper";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

const getDocumentData = async (supabase: SupabaseClient, id: string) => {
  console.log("[ID]", id);

  const { data, error } = await supabase
    .from("documents_data")
    .select(
      `
      *,
      documents (
        name
      )
    `
    )
    .eq("document_id", id)
    .single();

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  return data;
};

export const generateMetadata = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;

  const supabase = createServerSupabaseClient();
  const document = await getDocumentData(supabase, id);

  return {
    title: document.documents.name,
    description: document.documents.name,
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

  const supabase = createServerSupabaseClient();

  const document = await getDocumentData(supabase, id);
  const fields = await getDocumentFields(supabase, id);

  return (
    <div className="bg-gray-50">
      <ViewerWrapper document={document} fields={fields} />
    </div>
  );
};

export default SignPage;
