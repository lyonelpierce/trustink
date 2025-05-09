"use client";

import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { PencilIcon, Trash } from "lucide-react";
import { createPortal } from "react-dom";
import { Database } from "../../../../database.types";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useCallback, useEffect, useRef, useState } from "react";

export type ParagraphItemProps = {
  paragraph: Database["public"]["Tables"]["documents_lines"]["Row"];
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
  isSelected?: boolean;
  onSelect?: () => void;
};

export const ParagraphItem = ({
  paragraph,
  passive,
  minHeight,
  minWidth,
  defaultHeight,
  defaultWidth,
  onMove,
  onRemove,
  onFieldDeactivate,
  onFieldActivate,
  isSelected,
  onSelect,
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
    const pageY = (paragraph.position_y / 100) * height + top;

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

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
        width: coords.pageWidth,
      }}
      minHeight={minHeight || "auto"}
      minWidth={minWidth || "auto"}
      bounds={`${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${paragraph.page_number}"]`}
      onDragStart={() => onFieldActivate?.()}
      onDragStop={(_e, d) => {
        onFieldDeactivate?.();
        onMove?.(d.node);
      }}
      style={{
        overflow: "visible",
      }}
      onClick={handleClick}
    >
      <div
        ref={$el}
        data-field-id={paragraph.id}
        style={{
          overflow: "visible",
          whiteSpace: "nowrap",
          fontSize:
            paragraph.size && coords.pageScale
              ? `${paragraph.size * coords.pageScale}px`
              : paragraph.size
              ? `${paragraph.size}px`
              : undefined,
          fontStyle: paragraph.style === "italic" ? "italic" : undefined,
          fontWeight: paragraph.style === "bold" ? "bold" : undefined,
        }}
        className="hover:outline-2 hover:outline-dashed hover:outline-gray-300 rounded"
      >
        {paragraph.text}
        {isSelected && (
          <div className="z-[60] flex justify-center items-center absolute -top-6 right-0">
            <div className="dark:bg-background group flex items-center justify-evenly gap-x-1 rounded-md border bg-gray-900 p-0.5">
              <button className="cursor-pointer dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100">
                <PencilIcon className="h-3 w-3" />
              </button>
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
      </div>
    </Rnd>,
    document.body
  );
};
