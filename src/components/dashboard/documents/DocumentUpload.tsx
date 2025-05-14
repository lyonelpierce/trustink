"use client";

import { toast } from "sonner";
import { useState } from "react";
import Dropzone from "react-dropzone";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, FileIcon, Loader2Icon } from "lucide-react";

const DocumentUpload = () => {
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error("Upload failed");
        throw new Error("Upload failed");
      }

      const data = await response.json();

      toast.success("Document uploaded successfully");
      router.push(`/editor/${data.id}`);
    } catch (error) {
      console.error(error);
      setError("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="transition-all duration-300">
      <Dropzone
        onDrop={onDrop}
        accept={{
          "application/pdf": [".pdf"],
        }}
        multiple={false}
        disabled={isUploading}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={`border group rounded-lg p-8 transition-all duration-300 text-center cursor-pointer h-72 bg-[#fafafa] dark:bg-[#1a1a1a] flex flex-col items-center justify-center
                    ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 dark:border-zinc-700 hover:border-gray-400"
                    }
                    ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <Loader2Icon
                className="mx-auto h-24 w-24 text-gray-400 animate-spin"
                strokeWidth={1}
              />
            ) : (
              <div className="flex flex-col items-center justify-center relative">
                <FileIcon
                  className="mx-auto h-24 w-24 text-gray-400"
                  strokeWidth={1}
                />
                <ArrowUpIcon className="absolute top-14 left-1/2 -translate-x-1/2 -translate-y-1/2 mx-auto h-10 w-10 text-gray-400 transition-all duration-300 ease-in-out group-hover:animate-bounce" />
              </div>
            )}
            {isDragActive ? (
              <p className="mt-2 text-sm text-gray-600">
                Drop the file here...
              </p>
            ) : (
              <div>
                <p className="mt-2 text-sm text-zinc-600">
                  {isUploading
                    ? "Uploading..."
                    : "Drag and drop a PDF file here, or click to select a file"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">10MB max</p>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>
            )}
          </div>
        )}
      </Dropzone>
    </div>
  );
};

export default DocumentUpload;
