import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserDocuments } from "@/lib/supabase";
import DashbaordTitle from "@/components/dashboard/title";
import DocumentTabs from "@/components/dashboard/documents/DocumentTabs";
import DocumentUpload from "@/components/dashboard/documents/DocumentUpload";

export const metadata: Metadata = {
  title: "Documents",
  description: "Sign or request document signatures",
};

const DocumentsPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return redirect(`${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}`);
  }

  const documents = await getUserDocuments(userId);

  return (
    <div className="w-full flex flex-col gap-6">
      <DocumentUpload />
      <DashbaordTitle
        title="Documents"
        description="Sign or request document signatures"
      />
      <DocumentTabs documents={documents.data ?? []} />
    </div>
  );
};

export default DocumentsPage;
