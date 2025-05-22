"use client";

import ViewerHighlightItem from "./ViewerHighlightItem";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldItem } from "./FieldElement";
import ViewerParagraphItem from "./ParagraphItem";

const MIN_HEIGHT_PX = 12;
const MIN_WIDTH_PX = 36;

const DEFAULT_HEIGHT_PX = MIN_HEIGHT_PX * 2.5;
const DEFAULT_WIDTH_PX = MIN_WIDTH_PX * 2.5;

export type FieldFormType = {
  nativeId?: number;
  formId: string;
  secondary_id: string;
  pageNumber: number;
  type: Doc<"fields">["type"];
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
  recipient_id: string;
};

const Elements = ({
  fields,
  lines,
  isDocumentPdfLoaded,
  recipients,
}: {
  fields: Doc<"fields">[];
  lines: Doc<"lines">[];
  isDocumentPdfLoaded: boolean;
  recipients: Doc<"recipients">[];
}) => {
  const fieldBounds = useRef({
    height: 0,
    width: 0,
  });

  // Add this new state to track PDF readiness
  const [isPdfReady, setIsPdfReady] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const $page = document.querySelector(PDF_VIEWER_PAGE_SELECTOR);

      if (!$page) {
        return;
      }

      // Check if the PDF page has actual dimensions
      const { height, width } = $page.getBoundingClientRect();
      if (height > 0 && width > 0) {
        setIsPdfReady(true);

        fieldBounds.current = {
          height: Math.max(DEFAULT_HEIGHT_PX),
          width: Math.max(DEFAULT_WIDTH_PX),
        };
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true, // Also observe attribute changes
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isDocumentPdfLoaded && isPdfReady && documentHighlights.length > 0) {
      // Give the DOM a tick to render highlights
      setTimeout(() => {
        const firstHighlight = document.querySelector(
          `[data-highlight-id="${documentHighlights[0].id}"]`
        );
        if (firstHighlight) {
          firstHighlight.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100); // 100ms delay to ensure highlights are rendered
    }
  }, [documentHighlights, isDocumentPdfLoaded, isPdfReady]);

  // Only include fields that have a matching recipient
  const fieldsWithRecipients = fields
    .map((field) => {
      const recipient = recipients.find((r) => r._id === field.recipient_id);
      return recipient ? { ...field, recipients: recipient } : null;
    })
    .filter(Boolean) as (Doc<"fields"> & { recipients: Doc<"recipients"> })[];

  // Sort fields by page, vertical position, and horizontal position
  const sortedFields = [...fieldsWithRecipients].sort((a, b) => {
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    if (Math.abs(a.position_y - b.position_y) > 0.1) {
      return a.position_y - b.position_y;
    }
    return a.position_x - b.position_x;
  });

  const handleFieldClick = useCallback(
    (fieldId: Id<"fields">) => {
      setSelectedFieldId(fieldId === selectedFieldId ? null : fieldId);
    },
    [selectedFieldId, setSelectedFieldId]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any field
      if (!target.closest("[data-field-id]")) {
        setSelectedFieldId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setSelectedFieldId]);

  return (
    <div className="flex flex-col gap-4">
      {isDocumentPdfLoaded && isPdfReady && (
        <>
          {/* Render highlights below */}
          {documentHighlights.map((highlight) => (
            <ViewerHighlightItem
              key={highlight.id}
              highlight={highlight}
              minHeight={MIN_HEIGHT_PX}
              minWidth={MIN_WIDTH_PX}
              defaultHeight={DEFAULT_HEIGHT_PX}
              defaultWidth={DEFAULT_WIDTH_PX}
            />
          ))}
          {sortedFields.map((field) => (
            <FieldItem
              key={field._id}
              field={field}
              isSelected={field._id === selectedFieldId}
              onFieldClick={handleFieldClick}
            />
          ))}
          {lines.map((line) => (
            <ViewerParagraphItem
              key={line._id}
              line={line}
              minHeight={MIN_HEIGHT_PX}
              minWidth={MIN_WIDTH_PX}
              defaultHeight={DEFAULT_HEIGHT_PX}
              defaultWidth={DEFAULT_WIDTH_PX}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default Elements;
