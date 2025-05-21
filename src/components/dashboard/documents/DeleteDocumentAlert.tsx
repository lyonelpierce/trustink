"use client";

import { toast } from "sonner";
import { useState } from "react";
import {
  Credenza,
  CredenzaTitle,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaDescription,
} from "@/components/ui/credenza";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Doc } from "../../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const DeleteDocumentAlert = ({ document }: { document: Doc<"documents"> }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleDelete = async () => {
    try {
      await deleteDocument({ documentId: document._id });
      toast.success("Document deleted successfully");
      setIsOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaTrigger asChild>
        <Button variant="ghost" size="icon">
          <TrashIcon className="size-4" />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Delete Document</CredenzaTitle>
          <CredenzaDescription>
            Are you sure you want to delete this document &ldquo;{document.name}
            &rdquo;? This action cannot be undone.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};

export default DeleteDocumentAlert;
