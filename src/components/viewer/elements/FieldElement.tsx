"use client";

import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useCallback, useEffect, useState } from "react";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
const INDICATOR_HEIGHT = 32; // Fixed height for the indicator

export type FieldItemProps = {
  field: Doc<"fields"> & {
    recipients: Doc<"recipients">;
  };
  isSelected?: boolean;
  onFieldClick?: (fieldId: Id<"fields">) => void;
};

export const FieldItem = ({
  field,
  isSelected,
  onFieldClick,
}: FieldItemProps) => {
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: 0,
    pageWidth: 0,
    pageLeft: 0,
  });

  const calculateCoords = useCallback(() => {
    const $page = document.querySelector<HTMLElement>(
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.page}"]`
    );

    if (!$page) {
      return;
    }

    const { height, width, left, top } = $page.getBoundingClientRect();
    const pageLeft = left + window.scrollX;
    const pageTop = top + window.scrollY;

    // X and Y are percentages of the page's height and width
    const pageX = (field.position_x / 100) * width + pageLeft;
    const pageY = (field.position_y / 100) * height + pageTop;

    const pageHeight = (field.height / 100) * height;
    const pageWidth = (field.width / 100) * width;

    setCoords({
      pageX,
      pageY,
      pageHeight,
      pageWidth,
      pageLeft,
    });
  }, [
    field.height,
    field.width,
    field.page,
    field.position_x,
    field.position_y,
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

  const handleClick = useCallback(() => {
    if (onFieldClick) {
      onFieldClick(field.id);

      // Find the field element and scroll it into view
      const fieldElement = document.querySelector(
        `[data-field-id="${field.id}"]`
      );
      if (fieldElement) {
        fieldElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [field.id, onFieldClick]);

  return createPortal(
    <div
      style={{
        position: "absolute",
        left: coords.pageX,
        top: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
      }}
      className="z-10"
      onClick={handleClick}
    >
      <div
        className={cn(
          "absolute w-8 transition-all duration-200",
          isSelected ? "bg-blue-500" : "bg-transparent"
        )}
        style={{
          left: coords.pageLeft - coords.pageX - 32,
          height: INDICATOR_HEIGHT,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      <Card
        className={cn(
          "bg-field-card/80 h-full w-full backdrop-blur-[1px] overflow-hidden border-field-card-border cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-blue-500 ring-offset-2"
        )}
        data-field-id={field.id}
        style={{
          border: field.recipients.color
            ? `2px solid ${field.recipients.color}`
            : "none",
        }}
      >
        <CardContent
          className={cn(
            "text-field-card-foreground rounded-b-none select-none flex flex-col items-center justify-center p-2 bg-white w-full h-full text-sm font-medium",
            {
              "font-tangerine text-3xl": field.type === "signature",
            }
          )}
        >
          {FRIENDLY_FIELD_TYPE[field.type]}
          <p className="text-xs hidden">{field.recipients.email}</p>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
};
