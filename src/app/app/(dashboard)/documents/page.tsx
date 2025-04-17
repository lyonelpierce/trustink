import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import DashbaordTitle from "@/components/dashboard/title";
import { columns } from "@/components/dashboard/documents/Table/Columns";
import DocumentUpload from "@/components/dashboard/documents/DocumentUpload";
import { DocumentsTable } from "@/components/dashboard/documents/Table/DocumentsTable";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

export const metadata: Metadata = {
  title: "Documents",
  description: "Sign or request document signatures",
};

const getDocumentsWithData = async (userId: string) => {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("documents")
      .select(
        `
        *,
        recipients (
          document_id,
          user_id,
          signer_id
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const DocumentsPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return redirect(`${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}`);
  }

  const documents = await getDocumentsWithData(userId);

  return (
    <div className="w-full flex flex-col gap-6">
      <DashbaordTitle
        title="Documents"
        description="Sign or request document signatures"
      />
      <DocumentUpload />
      <DocumentsTable columns={columns} data={documents ?? []} />
    </div>
  );
};

export default DocumentsPage;
