import { SupabaseClient } from "@supabase/supabase-js";
import { PDFViewer } from "@/components/editor/PDF-Viewer";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

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
      <PDFViewer className="max-w-3xl h-full" documentData={document} />
    </div>
  );
};

export default SingleDocumentPage;
