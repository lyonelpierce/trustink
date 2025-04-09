"use client";

import {
  FileIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
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
import Dropzone from "react-dropzone";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const AddDocumentModal = () => {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    setPageCount(3); // Replace this with actual page count logic
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPageCount(0);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile as File);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();

      toast.success("Document uploaded successfully");
      router.push(`/documents/${data.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload document");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Dropzone
              onDrop={onDrop}
              accept={{
                "application/pdf": [".pdf"],
              }}
              multiple={false}
            >
              {({ getRootProps, getInputProps, isDragActive }) => (
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
              )}
            </Dropzone>
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
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CredenzaBody>
        <CredenzaFooter className="flex justify-between">
          <Button
            type="submit"
            disabled={!selectedFile || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? <Loader2Icon className="animate-spin" /> : "Continue"}
          </Button>
          <CredenzaClose asChild>
            <Button
              variant="link"
              onClick={() => setSelectedFile(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};

export default AddDocumentModal;
