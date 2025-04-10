"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { PDFDocumentProxy } from "pdfjs-dist";
import { Database } from "../../../database.types";
import { useEffect, useState, useRef } from "react";
import { useDocumentElement } from "../../hooks/use-document-element";
import { Document as PDFDocument, Page as PDFPage, pdfjs } from "react-pdf";

export type OnPDFViewerPageClick = (_event: {
  pageNumber: number;
  numPages: number;
  originalEvent: React.MouseEvent<HTMLDivElement, MouseEvent>;
  pageHeight: number;
  pageWidth: number;
  pageX: number;
  pageY: number;
}) => void | Promise<void>;

export type LoadedPDFDocument = PDFDocumentProxy;

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const PDFLoader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2Icon className="h-10 w-10 animate-spin" />
      <p className="mt-4">Loading document...</p>
    </div>
  );
};

export const PDFViewer = ({
  className,
  documentData,
  onDocumentLoad,
  onPageClick,
  ...props
}: {
  className?: string;
  documentData: Database["public"]["Tables"]["documents_data"]["Row"];
  onDocumentLoad?: (_doc: LoadedPDFDocument) => void;
  onPageClick?: OnPDFViewerPageClick;
  [key: string]: unknown;
}) => {
  const [documentBytes, setDocumentBytes] = useState<Uint8Array | null>(null);
  const [isDocumentBytesLoading, setIsDocumentBytesLoading] = useState(false);

  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  const $el = useRef<HTMLDivElement>(null);

  const isLoading = isDocumentBytesLoading || !documentBytes;

  const { isWithinPageBounds } = useDocumentElement();

  const onDocumentLoaded = (doc: LoadedPDFDocument) => {
    setNumPages(doc.numPages);
    onDocumentLoad?.(doc);
  };

  useEffect(() => {
    if ($el.current) {
      const $current = $el.current;

      const { width } = $current.getBoundingClientRect();

      setWidth(width);

      const onResize = () => {
        const { width } = $current.getBoundingClientRect();

        setWidth(width);
      };

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }
  }, []);

  useEffect(() => {
    const fetchDocumentBytes = async () => {
      try {
        setIsDocumentBytesLoading(true);

        const base64 = documentData.data;
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        setDocumentBytes(bytes);
        setIsDocumentBytesLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("An error occurred while loading the document.");
        setIsDocumentBytesLoading(false);
      }
    };

    void fetchDocumentBytes();
  }, [documentData.data]);

  const onDocumentPageClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    pageNumber: number
  ) => {
    console.log("clicked");

    console.log(isWithinPageBounds);

    const $el = event.target instanceof HTMLElement ? event.target : null;

    if (!$el) {
      return;
    }

    const $page = $el.closest(".react-pdf__Page");

    if (!$page) {
      return;
    }

    const { height, width, top, left } = $page.getBoundingClientRect();

    const pageX = event.clientX - left;
    const pageY = event.clientY - top;

    if (onPageClick) {
      void onPageClick({
        pageNumber,
        numPages,
        originalEvent: event,
        pageHeight: height,
        pageWidth: width,
        pageX,
        pageY,
      });
    }
  };

  return (
    <div ref={$el} className={cn("overflow-hidden", className)} {...props}>
      {isLoading ? (
        <PDFLoader />
      ) : (
        <div className="flex w-full justify-between">
          <PDFDocument
            file={new Blob([documentBytes!], { type: "application/pdf" })}
            externalLinkTarget="_blank"
            className={cn("w-full overflow-hidden rounded", {
              "h-[80vh] max-h-[60rem]": numPages === 0,
            })}
            // @ts-expect-error - PDFDocumentProxy is not typed
            onLoadSuccess={(d) => onDocumentLoaded(d)}
            onSourceError={() => {
              setPdfError(true);
            }}
            loading={
              <div className="dark:bg-background flex h-[80vh] max-h-[60rem] flex-col items-center justify-center bg-white/50">
                {pdfError ? (
                  <div className="text-muted-foreground text-center">
                    <p>
                      <p>Something went wrong while loading the document.</p>
                    </p>
                    <p className="mt-1 text-sm">
                      <p>Please try again or contact our support.</p>
                    </p>
                  </div>
                ) : (
                  <PDFLoader />
                )}
              </div>
            }
            error={
              <div className="dark:bg-background flex h-[80vh] max-h-[60rem] flex-col items-center justify-center bg-white/50">
                <div className="text-muted-foreground text-center">
                  <p>
                    <p>Something went wrong while loading the document.</p>
                  </p>
                  <p className="mt-1 text-sm">
                    <p>Please try again or contact our support.</p>
                  </p>
                </div>
              </div>
            }
          >
            {Array(numPages)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="last:-mb-2">
                  <div className="border-border overflow-hidden rounded border will-change-transform">
                    <PDFPage
                      pageNumber={i + 1}
                      width={width}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      loading={() => ""}
                      onClick={(e) => onDocumentPageClick(e, i + 1)}
                    />
                  </div>
                  <p className="text-muted-foreground/80 my-2 text-center text-[11px]">
                    <span>
                      Page {i + 1} of {numPages}
                    </span>
                  </p>
                </div>
              ))}
          </PDFDocument>
        </div>
      )}
    </div>
  );
};
