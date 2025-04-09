import PDFViewer from "@/components/editor/PDFWrapper";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

const getDocument = async (id: string) => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select("path")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from("documents")
    .createSignedUrl(data.path, 3600);

  if (signedUrlError) {
    throw new Error(signedUrlError.message);
  }

  return { signedUrl };
};

const SingleDocumentPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;

  const document = await getDocument(id);

  return (
    <div>
      <PDFViewer url={document.signedUrl.signedUrl} />
    </div>
  );
};

export default SingleDocumentPage;
