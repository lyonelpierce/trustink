"use client";

import { useState } from "react";
import { Document, Page } from "react-pdf";

import "../../../lib/pdf-worker";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

export default function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  function goToNextPage() {
    setPageNumber((prev) => (prev < (numPages ?? 1) ? prev + 1 : prev));
  }

  function goToPreviousPage() {
    setPageNumber((prev) => (prev > 1 ? prev - 1 : prev));
  }

  return (
    <div>
      <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
      <div className="flex gap-2 items-center justify-center mt-4">
        <button
          onClick={goToPreviousPage}
          disabled={pageNumber <= 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <p>
          Page {pageNumber} of {numPages}
        </p>
        <button
          onClick={goToNextPage}
          disabled={pageNumber >= (numPages ?? 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
