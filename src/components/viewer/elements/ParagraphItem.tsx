"use client";

import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Doc } from "../../../../convex/_generated/dataModel";

export type ViewerParagraphItemProps = {
  line: Doc<"lines">;
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
};

export const ViewerParagraphItem = ({
  line,
  minHeight,
  minWidth,
  defaultHeight,
  defaultWidth,
}: ViewerParagraphItemProps) => {
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
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${line.page_number}"]`
    );

    if (!$page) {
      return;
    }

    const { height, width } = $page.getBoundingClientRect();
    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;

    const pageX = (line.position_x / 100) * width + left;
    const pageY = (line.position_y / 100) * height + top;
    const pageHeight = (line.height / 100) * height;
    const pageWidth = (line.width / 100) * width;

    setCoords({
      pageX,
      pageY,
      pageHeight,
      pageWidth,
      pageScale: height / 792, // Assuming standard PDF height is 792px (letter size)
    });
  }, [
    line.page_number,
    line.position_x,
    line.position_y,
    line.height,
    line.width,
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
    <div
      ref={$el}
      data-field-id={line._id}
      style={{
        position: "absolute",
        left: coords.pageX,
        top: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
        minHeight: minHeight,
        minWidth: minWidth,
        overflow: "visible",
        fontSize:
          line.size && coords.pageScale
            ? `${line.size * coords.pageScale}px`
            : line.size
              ? `${line.size}px`
              : undefined,
        fontStyle: line.style === "italic" ? "italic" : undefined,
        fontWeight: line.style === "bold" ? "bold" : undefined,
        background: "transparent",
        color: "#222",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        pointerEvents: "none", // disables all interaction
        zIndex: 10,
      }}
      className={cn("rounded select-none", "viewer-paragraph-item")}
    >
      {line.text}
    </div>,
    document.body
  );
};

export default ViewerParagraphItem;
