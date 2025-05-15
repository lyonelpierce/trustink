import { after } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SupabaseClient } from "@supabase/supabase-js";
import EditorWrapper from "@/components/editor/EditorWrapper";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

const parseDocument = async (
  supabase: SupabaseClient,
  path: string,
  userId: string,
  documentId: string
) => {
  try {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600);

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    after(() => {
      fetch(`${process.env.BACKEND_API}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdf_url: data.signedUrl,
          user_id: userId,
          document_id: documentId,
        }),
      });
    });

    return data.signedUrl;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

const getDocumentData = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      documents_data (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  return data;
};

const getUserInfo = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("clerk_id", userId)
      .single();

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

export const generateMetadata = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;

  const supabase = createServerSupabaseClient();
  const document = await getDocumentData(supabase, id);

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

const SingleDocumentPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = createServerSupabaseClient();

  const document = await getDocumentData(supabase, id);
  const fields = await getDocumentFields(supabase, id);
  const userInfo = await getUserInfo(supabase, userId);
  const documentUrl = await parseDocument(supabase, document.path, userId, id);

  return (
    <div className="bg-gray-50 min-h-screen">
      <EditorWrapper
        key={document.id}
        document={document}
        fields={fields}
        userInfo={userInfo}
        documentUrl={documentUrl}
      />
    </div>
  );
};

export default SingleDocumentPage;
