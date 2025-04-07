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
import { FileIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react";
import { useState } from "react";

const AddDocumentModal = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);

    // Here you would typically get the page count from your backend
    // For now, we'll set a dummy value
    setPageCount(3); // Replace this with actual page count logic
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPageCount(0);
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
          {!selectedFile ? (
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
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {pageCount} pages • {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="h-8 w-8 p-0"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CredenzaBody>
        <CredenzaFooter className="flex justify-between">
          <Button type="submit" disabled={!selectedFile}>
            Continue
          </Button>
          <CredenzaClose asChild>
            <Button variant="link">Cancel</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};

export default AddDocumentModal;
