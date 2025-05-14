import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import DashboardTitle from "@/components/dashboard/title";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import { columns } from "@/components/dashboard/documents/Table/Columns";
import DocumentUpload from "@/components/dashboard/documents/DocumentUpload";
import { DocumentsTable } from "@/components/dashboard/documents/Table/DocumentsTable";
import { FileIcon, FileStackIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      <DashboardTitle
        title="Documents"
        description="Sign or request document signatures"
        icon={<FileStackIcon className="size-6 text-white" />}
      />
      <div className="flex gap-4">
        <div className="w-1/2">
          <DocumentUpload />
        </div>
        <div className="w-1/2 relative group cursor-not-allowed">
          <Badge className="absolute -top-3 -right-2 p-2 z-50">
            Comming soon
          </Badge>
          <div className="flex flex-col opacity-70 cursor-not-allowed bg-[#fafafa] h-full items-center justify-center dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-300 hover:border-gray-400 transition-all duration-300">
            <FileIcon className="w-24 h-24 text-gray-400" strokeWidth={1} />
            <div className="absolute pb-10 top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
              <SparklesIcon className="w-10 h-10 text-gray-400 group-hover:animate-spin" />
            </div>
            <div className="flex flex-col items-center">
              <p className="mt-2 text-sm text-zinc-600">Generate with AI</p>
              <p className="mt-1 text-xs text-zinc-500">
                Generate a document with AI
              </p>
            </div>
          </div>
        </div>
      </div>
      <DocumentsTable columns={columns} data={documents ?? []} />
    </div>
  );
};

export default DocumentsPage;
