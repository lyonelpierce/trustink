import { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import { LazyPDFViewerNoLoader } from "@/components/editor/LazyPDFViewer";

const getDocument = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from("documents_data")
    .select("*")
    .eq("document_id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const SingleDocumentPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const supabase = createServerSupabaseClient();

  const document = await getDocument(supabase, id);

  return (
    <div>
      <LazyPDFViewerNoLoader documentData={document} />
    </div>
  );
};

export default SingleDocumentPage;
