import { Metadata } from "next";
import DashbaordTitle from "@/components/dashboard/title";
import AddDocumentModal from "@/components/dashboard/documents/AddDocumentModal";

export const metadata: Metadata = {
  title: "Documents",
  description: "Sign or request document signatures",
};

const DocumentsPage = () => {
  return (
    <div className="flex justify-between items-center w-full">
      <DashbaordTitle
        title="Documents"
        description="Sign or request document signatures"
      />
      <AddDocumentModal />
    </div>
  );
};

export default DocumentsPage;
