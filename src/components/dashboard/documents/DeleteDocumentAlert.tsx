"use client";

import { toast } from "sonner";
import { useState } from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaFooter,
  CredenzaDescription,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Database } from "../../../../database.types";

const DeleteDocumentAlert = ({
  document,
}: {
  document: Database["public"]["Tables"]["documents"]["Row"];
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    const response = await fetch(`/api/documents?id=${document.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      toast.success("Document deleted successfully");
      setIsOpen(false);
      router.refresh();
    } else {
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
