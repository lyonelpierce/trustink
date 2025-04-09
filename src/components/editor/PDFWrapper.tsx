"use client";

import { useState, useEffect } from "react";
import { Worker } from "@react-pdf-viewer/core";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import Toolbar from "./PDFViewer";

export default function PDFViewer({ url }: { url: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="h-full">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
        <div className="h-full">
          <div className="fixed top-0 z-50 w-full" style={{ height: "100vh" }}>
            <Toolbar fileUrl={url} />
          </div>
        </div>
      </Worker>
    </div>
  );
}
