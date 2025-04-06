"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAddEditSignatureModalStore from "@/store/AddEditSignatureModalStore";

const AddEditSignatureButton = () => {
  const { setIsOpen, setType } = useAddEditSignatureModalStore();

  return (
    <Button
      className="gap-1"
      onClick={() => {
        setIsOpen(true);
        setType("add");
      }}
    >
      <PlusIcon />
      Add Signature
    </Button>
  );
};

export default AddEditSignatureButton;
