"use client";

import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { Trash } from "lucide-react";
import { createPortal } from "react-dom";
import { Database } from "../../../../database.types";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useCallback, useEffect, useRef, useState } from "react";

export type ParagraphItemProps = {
  paragraph: Database["public"]["Tables"]["documents_paragraphs"]["Row"];
  passive?: boolean;
  disabled?: boolean;
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
  fontSize?: string | number;
  onResize?: (_node: HTMLElement) => void;
  onMove?: (_node: HTMLElement) => void;
  onRemove?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  active?: boolean;
  onFieldDeactivate?: () => void;
  onFieldActivate?: () => void;
};

export const ParagraphItem = ({
  paragraph,
  passive,
  disabled,
  minHeight,
  minWidth,
  defaultHeight,
  defaultWidth,
  active,
  onResize,
  onMove,
  onRemove,
  onFieldDeactivate,
  onFieldActivate,
}: ParagraphItemProps) => {
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: defaultHeight || 0,
    pageWidth: defaultWidth || 0,
    fontSize: "inherit" as string,
  });
  const $el = useRef(null);

  const calculateCoords = useCallback(() => {
    const $page = document.querySelector<HTMLElement>(
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${paragraph.page_number}"]`
    );

    if (!$page) {
      return;
    }

    const { height, width } = $page.getBoundingClientRect();

    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;

    // Extract coordinates from bbox array [x1, y1, x2, y2]
    const [x1, y1, x2, y2] = paragraph.bbox;

    // PyMuPDF coordinates are in points (72 points = 1 inch)
    // Standard PDF dimensions in points (Letter size: 8.5 x 11 inches)
    const PDF_WIDTH_PT = 612; // 8.5 * 72
    const PDF_HEIGHT_PT = 792; // 11 * 72

    // Calculate the scale factor based on the rendered size vs PDF points
    const scaleFactor = width / PDF_WIDTH_PT;

    // Scale the font size according to the page scale
    const fontSize = paragraph.size
      ? `${paragraph.size * scaleFactor}px`
      : "inherit";

    // Convert from PDF points to percentages
    const position_x = (x1 / PDF_WIDTH_PT) * 100;
    // PDF coordinates are from bottom-left, we need to transform to top-left for screen coordinates
    const position_y = (y1 / PDF_HEIGHT_PT) * 100;

    // Calculate dimensions in percentages with a width adjustment factor to prevent text wrapping
    const widthAdjustmentFactor = 1.15; // Add 5% to the width to prevent wrapping
    const boxWidth = ((x2 - x1) / PDF_WIDTH_PT) * 100 * widthAdjustmentFactor;
    const boxHeight = ((y2 - y1) / PDF_HEIGHT_PT) * 80;

    // Convert percentages to actual pixels for positioning, with offset adjustments
    const horizontalOffset = width * 0.02; // 2% right offset
    const verticalOffset = height * 0.01; // 3% up offset
    const pageX = (position_x / 100) * width + left + horizontalOffset;
    const pageY =
      (position_y / 100) * height +
      top -
      (boxHeight / 100) * height * 0.5 +
      verticalOffset;

    const pageHeight = (boxHeight / 100) * height;
    const pageWidth = (boxWidth / 100) * width;

    setCoords({
      pageX,
      pageY,
      pageHeight,
      pageWidth,
      fontSize,
    });
  }, [paragraph.bbox, paragraph.page_number, paragraph.size]);

  useEffect(() => {
    calculateCoords();
  }, [calculateCoords]);

  useEffect(() => {
    const onResize = () => {
      calculateCoords();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [calculateCoords]);

  return createPortal(
    <Rnd
      key={coords.pageX + coords.pageY + coords.pageHeight + coords.pageWidth}
      className={cn("group", {
        "pointer-events-none": passive,
        "pointer-events-none cursor-not-allowed opacity-75": disabled,
        "z-50": active && !disabled,
        "z-20": !active && !disabled,
        "z-10": disabled,
      })}
      default={{
        x: coords.pageX,
        y: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
      }}
      minHeight={minHeight || "auto"}
      minWidth={minWidth || "auto"}
      bounds={`${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${paragraph.page_number}"]`}
      onDragStart={() => onFieldActivate?.()}
      onResizeStart={() => onFieldActivate?.()}
      onResizeStop={(_e, _d, ref) => {
        onFieldDeactivate?.();
        onResize?.(ref);
      }}
      onDragStop={(_e, d) => {
        onFieldDeactivate?.();
        onMove?.(d.node);
      }}
      resizeHandleStyles={{
        bottom: { bottom: -8, cursor: "ns-resize" },
        top: { top: -8, cursor: "ns-resize" },
        left: { cursor: "ew-resize" },
        right: { cursor: "ew-resize" },
      }}
      style={{
        overflow: "visible",
      }}
    >
      <div
        ref={$el}
        data-field-id={paragraph.id}
        style={{
          overflow: "visible",
          fontSize: coords.fontSize,
        }}
      >
        {paragraph.text}
      </div>

      {!disabled && (
        <div className="z-[60] flex justify-center items-center">
          <div className="dark:bg-background group flex items-center justify-evenly gap-x-1 rounded-md border bg-gray-900 p-0.5">
            <button
              className="cursor-pointer dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
              onClick={onRemove}
              onTouchEnd={onRemove}
            >
              <Trash className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </Rnd>,
    document.body
  );
};
