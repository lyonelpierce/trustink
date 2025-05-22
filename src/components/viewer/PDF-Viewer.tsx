"use client";

import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useState, useRef } from "react";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
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

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const PDFLoader = () => {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <Loader2Icon className="h-10 w-10 animate-spin" />
      <p className="mt-4">Loading document...</p>
    </div>
  );
};

export const PDFViewer = ({
  className,
  documentUrl,
  onDocumentLoad,
  onPageClick,
  ...props
}: {
  className?: string;
  documentUrl: string;
  onDocumentLoad?: (_doc: LoadedPDFDocument) => void;
  onPageClick?: OnPDFViewerPageClick;
  [key: string]: unknown;
}) => {
  const $el = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  const onDocumentLoaded = (doc: LoadedPDFDocument) => {
    setNumPages(doc.numPages);
    onDocumentLoad?.(doc);
  };

  const onDocumentPageClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    pageNumber: number
  ) => {
    const $el = event.target instanceof HTMLElement ? event.target : null;

    if (!$el) {
      return;
    }

    const $page = $el.closest(PDF_VIEWER_PAGE_SELECTOR);

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

  return (
    <div ref={$el} className={cn("overflow-hidden", className)} {...props}>
      <PDFDocument
        file={documentUrl}
        className={cn("w-full overflow-hidden rounded", {
          "h-[80vh] max-h-[60rem]": numPages === 0,
        })}
        onLoadSuccess={(d) => onDocumentLoaded(d)}
        onSourceError={() => {
          setPdfError(true);
        }}
        externalLinkTarget="_blank"
        loading={
          <div className="dark:bg-background flex h-[80vh] max-h-[60rem] flex-col items-center justify-center bg-white/50">
            {pdfError ? (
              <div className="text-muted-foreground text-center">
                <div>
                  <p>Something went wrong while loading the document.</p>
                </div>
                <div className="mt-1 text-sm">
                  <p>Please try again or contact our support.</p>
                </div>
              </div>
            ) : (
              <PDFLoader />
            )}
          </div>
        }
        error={
          <div className="dark:bg-background flex h-[80vh] max-h-[60rem] flex-col items-center justify-center bg-white/50">
            <div className="text-muted-foreground text-center">
              <div>
                <p>Something went wrong while loading the document.</p>
              </div>
              <div className="mt-1 text-sm">
                <p>Please try again or contact our support.</p>
              </div>
            </div>
          </div>
        }
      >
        {Array(numPages)
          .fill(null)
          .map((_, i) => (
            <div key={i}>
              <div className="border-border overflow-hidden rounded border will-change-transform">
                <PDFPage
                  pageNumber={i + 1}
                  width={width}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={() => ""}
                  onClick={(e) => onDocumentPageClick(e, i + 1)}
                  className="[&_canvas]:opacity-0"
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
  );
};
