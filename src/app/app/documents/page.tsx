import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserDocuments } from "@/lib/supabase";
import DashbaordTitle from "@/components/dashboard/title";
import { columns } from "@/components/dashboard/documents/Table/Columns";
import AddDocumentModal from "@/components/dashboard/documents/AddDocumentModal";
import { DocumentsTable } from "@/components/dashboard/documents/Table/DocumentsTable";

export const metadata: Metadata = {
  title: "Documents",
  description: "Sign or request document signatures",
};

const DocumentsPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const documents = await getUserDocuments(userId);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center w-full mb-8">
        <DashbaordTitle
          title="Documents"
          description="Sign or request document signatures"
        />
        <AddDocumentModal />
      </div>
      <DocumentsTable columns={columns} data={documents.data ?? []} />
    </div>
  );
};

export default DocumentsPage;
