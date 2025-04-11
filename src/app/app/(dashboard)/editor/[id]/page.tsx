import { SupabaseClient } from "@supabase/supabase-js";
import EditorWrapper from "@/components/editor/EditorWrapper";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

const getDocumentData = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from("documents_data")
    .select("*")
    .eq("document_id", id)
    .single();

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  return data;
};

const getDocumentFields = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from("fields")
    .select("*")
    .eq("document_id", id);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  return data;
};

const SingleDocumentPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const supabase = createServerSupabaseClient();

  const document = await getDocumentData(supabase, id);
  const fields = await getDocumentFields(supabase, id);

  return (
    <div>
      <EditorWrapper document={document} fields={fields} />
    </div>
  );
};

export default SingleDocumentPage;
