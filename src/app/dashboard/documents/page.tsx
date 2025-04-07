import DashbaordTitle from "@/components/dashboard/title";
import AddDocumentButton from "@/components/dashboard/documents/AddDocumentButton";

const DocumentsPage = () => {
  return (
    <div className="flex justify-between items-center w-full">
      <DashbaordTitle
        title="Documents"
        description="Sign or request documents signatures"
      />
      <AddDocumentButton />
    </div>
  );
};

export default DocumentsPage;
