"use client";

import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import React, { useCallback, useEffect, useRef, useState } from "react";

export type ViewerHighlightItemProps = {
  highlight: {
    id: string;
    document_id: string;
    user_id: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    page: number;
    // add any other fields if needed
  };
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
};

const ViewerHighlightItem = ({
  highlight,
  minHeight,
  minWidth,
  defaultHeight,
  defaultWidth,
}: ViewerHighlightItemProps) => {
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
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${highlight.page}"]`
    );
    if (!$page) return;
    const { height, width } = $page.getBoundingClientRect();
    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;
    const pageX = (highlight.position_x / 100) * width + left;
    const pageY = (highlight.position_y / 100) * height + top;
    const pageHeight = (highlight.height / 100) * height;
    const pageWidth = (highlight.width / 100) * width;
    setCoords({
      pageX,
      pageY,
      pageHeight,
      pageWidth,
      pageScale: height / 792, // Assuming standard PDF height is 792px
    });
  }, [highlight]);

  useEffect(() => {
    calculateCoords();
  }, [calculateCoords]);

  useEffect(() => {
    const onResize = () => calculateCoords();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [calculateCoords]);

  return createPortal(
    <div
      ref={$el}
      data-highlight-id={highlight.id}
      style={{
        position: "absolute",
        left: coords.pageX,
        top: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
        minHeight: minHeight,
        minWidth: minWidth,
        background: "rgba(255, 255, 0, 0.3)", // yellow highlight
        borderRadius: 4,
        pointerEvents: "none",
        zIndex: 5,
      }}
      className={cn("viewer-highlight-item")}
    />,
    document.body
  );
};

export default ViewerHighlightItem;
