"use client";

import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { Trash } from "lucide-react";
import { createPortal } from "react-dom";
import { Database } from "../../../../database.types";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useCallback, useEffect, useRef, useState } from "react";

// Add type definition for formatting
type FormattingItem = {
  text: string;
  color: string;
  size: string | number;
  bold: boolean;
  font?: string;
  italic?: boolean;
};

export type ParagraphItemProps = {
  paragraph: Database["public"]["Tables"]["documents_paragraphs"]["Row"];
  passive?: boolean;
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
  onResize?: (_node: HTMLElement) => void;
  onMove?: (_node: HTMLElement) => void;
  onRemove?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onFieldDeactivate?: () => void;
  onFieldActivate?: () => void;
};

export const ParagraphItem = ({
  paragraph,
  passive,
  minHeight,
  minWidth,
  defaultHeight,
  defaultWidth,
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
    pageScale: 1,
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

    const pageX = (paragraph.position_x / 100) * width + left;
    const pageY =
      (paragraph.position_y / 100) * height +
      top -
      (paragraph.height / 100) * height * 0.5;

    const pageHeight = (paragraph.height / 100) * height;
    const pageWidth = (paragraph.width / 100) * width;

    setCoords({
      pageX,
      pageY,
      pageHeight,
      pageWidth,
      pageScale: height / 792, // Assuming standard PDF height is 792px (letter size)
    });
  }, [
    paragraph.page_number,
    paragraph.position_x,
    paragraph.position_y,
    paragraph.height,
    paragraph.width,
  ]);

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
      })}
      default={{
        x: coords.pageX,
        y: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth * 2,
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
        }}
      >
        {paragraph.formatting &&
          Array.isArray(paragraph.formatting) &&
          paragraph.formatting.map((item, i: number) => {
            const formatting = item as unknown as FormattingItem;
            const scaledFontSize = formatting.size
              ? typeof formatting.size === "number"
                ? `${Number(formatting.size) * (coords.pageScale || 1)}px`
                : formatting.size
              : "inherit";

            return (
              <span
                key={i}
                style={{
                  color: formatting.color,
                  fontSize: scaledFontSize,
                  fontWeight: formatting.bold ? "bold" : "normal",
                  fontStyle: formatting.italic ? "italic" : "normal",
                  fontFamily: formatting.font || "inherit",
                }}
              >
                {formatting.text}
              </span>
            );
          })}
      </div>
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
    </Rnd>,
    document.body
  );
};
