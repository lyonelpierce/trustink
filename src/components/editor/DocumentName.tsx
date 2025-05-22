"use client";

import { Input } from "../ui/input";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const DocumentName = ({
  documentName,
  documentId,
}: {
  documentName: string;
  documentId: string;
}) => {
  const [name, setName] = useState(documentName || "Untitled document");
  const inputRef = useRef<HTMLInputElement>(null);

  const updateDocumentName = useMutation(api.documents.updateDocumentName);

  // Add resize effect
  useEffect(() => {
    if (inputRef.current) {
      const span = document.createElement("span");
      span.style.visibility = "hidden";
      span.style.position = "absolute";
      span.style.whiteSpace = "pre";
      const styles = window.getComputedStyle(inputRef.current);
      span.style.font = styles.font;
      span.style.padding = styles.padding;
      document.body.appendChild(span);

      span.textContent = name || "Untitled";
      const width = span.offsetWidth + 20;
      inputRef.current.style.width = `${width}px`;

      document.body.removeChild(span);
    }
  }, [name]);

  const debouncedUpdate = useDebouncedCallback(async (newName: string) => {
    const finalName = newName.trim() || "Untitled document";
    try {
      await updateDocumentName({
        documentId: documentId as Id<"documents">,
        name: finalName,
      });
      setName(finalName);

      // Update metadata after successful save
      document.title = `${finalName} | Trustink`;
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute("content", `Edit document: ${finalName}`);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = `Edit document: ${finalName}`;
        document.head.appendChild(meta);
      }
    } catch (error) {
      setName(documentName);
      console.error(error);
    }
  }, 500);

  return (
    <Input
      ref={inputRef}
      value={name}
      onChange={(e) => {
        setName(e.target.value);
        debouncedUpdate(e.target.value);
      }}
      onBlur={(e) => {
        const finalName = e.target.value.trim() || "Untitled document";
        setName(finalName);
        debouncedUpdate(finalName);
      }}
      className="min-w-0 max-w-60 border-0 hover:border rounded-none px-1 shadow-none text-center py-0 md:text-lg truncate hover:bg-[#fafafa] font-medium"
    />
  );
};

export default DocumentName;
