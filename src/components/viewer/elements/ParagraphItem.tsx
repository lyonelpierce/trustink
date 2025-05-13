"use client";

import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Database } from "../../../../database.types";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import React, { useCallback, useEffect, useRef, useState } from "react";

export type ViewerParagraphItemProps = {
  paragraph: Database["public"]["Tables"]["documents_lines"]["Row"];
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
};

export const ViewerParagraphItem = ({
  paragraph,
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

  return createPortal(
    <div
      ref={$el}
      data-field-id={paragraph.id}
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
          paragraph.size && coords.pageScale
            ? `${paragraph.size * coords.pageScale}px`
            : paragraph.size
              ? `${paragraph.size}px`
              : undefined,
        fontStyle: paragraph.style === "italic" ? "italic" : undefined,
        fontWeight: paragraph.style === "bold" ? "bold" : undefined,
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
      {paragraph.text}
    </div>,
    document.body
  );
};

export default ViewerParagraphItem;
