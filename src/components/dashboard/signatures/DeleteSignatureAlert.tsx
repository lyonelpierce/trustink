"use client";

import {
  Credenza,
  CredenzaTitle,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaDescription,
} from "@/components/ui/credenza";
import { toast } from "sonner";
import { useState } from "react";
import Signature from "./Signature";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Doc } from "../../../../convex/_generated/dataModel";

const DeleteSignatureAlert = ({
  signature,
}: {
  signature: Doc<"signatures">;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const response = await fetch(`/api/signatures?id=${signature._id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      toast.success("Signature deleted successfully");
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete signature");
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
          <CredenzaTitle>Delete Signature</CredenzaTitle>
          <div className="flex justify-center items-center p-4">
            <Signature
              fullName={signature.full_name}
              initials={signature.initials}
              font={signature.font}
              className="text-5xl"
            />
          </div>
          <CredenzaDescription>
            Are you sure you want to delete this signature? This action cannot
            be undone.
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

export default DeleteSignatureAlert;
