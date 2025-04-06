"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { PencilIcon } from "lucide-react";
import { Database } from "../../../../database.types";
import DeleteSignatureAlert from "./DeleteSignatureAlert";
import useAddEditSignatureModalStore from "@/store/AddEditSignatureModalStore";

const SignaturesTable = ({
  signatures,
}: {
  signatures: Database["public"]["Tables"]["signatures"]["Row"][];
}) => {
  const { setIsOpen, setType, setSignature } = useAddEditSignatureModalStore();

  if (signatures.length === 0) {
    return (
      <div className="text-center text-sm py-8 text-muted-foreground">
        No signatures found. Create one to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/2">Full Name</TableHead>
          <TableHead className="w-1/2">Initials</TableHead>
          <TableHead className="text-center w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {signatures.map((signature) => (
          <TableRow key={signature.id}>
            <TableCell className={cn("font-medium text-4xl", signature.font)}>
              {signature.full_name}
            </TableCell>
            <TableCell className={cn("text-4xl", signature.font)}>
              {signature.initials}
            </TableCell>
            <TableCell className="flex gap-1 justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSignature(signature);
                  setType("edit");
                  setIsOpen(true);
                }}
              >
                <PencilIcon className="size-4" />
              </Button>
              <DeleteSignatureAlert signature={signature} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SignaturesTable;
