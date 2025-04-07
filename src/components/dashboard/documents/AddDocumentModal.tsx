"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaTitle,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTrigger,
  CredenzaContent,
} from "@/components/ui/credenza";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { PlusIcon, UploadIcon } from "lucide-react";

const AddDocumentModal = () => {
  const onDrop = (acceptedFiles: File[]) => {
    // Handle the uploaded files here
    console.log(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button className="gap-1">
          <PlusIcon />
          Add Document
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Upload Document</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            {isDragActive ? (
              <p className="mt-2 text-sm text-gray-600">
                Drop the file here...
              </p>
            ) : (
              <div>
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop a PDF file here, or click to select a file
                </p>
                <p className="mt-1 text-xs text-gray-500">10MB max</p>
              </div>
            )}
          </div>
        </CredenzaBody>
        <CredenzaFooter className="flex justify-between">
          <Button type="submit">Continue</Button>
          <CredenzaClose asChild>
            <Button variant="link">Cancel</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};

export default AddDocumentModal;
