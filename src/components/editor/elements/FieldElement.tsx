"use client";

import { useCallback, useEffect, useState } from "react";

import { Rnd } from "react-rnd";
import { Trash } from "lucide-react";
import { createPortal } from "react-dom";

import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";

import { cn } from "@/lib/utils";
import { Database } from "../../../../database.types";
import { Card, CardContent } from "@/components/ui/card";
import { FRIENDLY_FIELD_TYPE } from "@/constants/FieldTypes";

type Field = {
  pageNumber: number;
  pageX: number;
  pageY: number;
  pageHeight: number;
  pageWidth: number;
  type: Database["public"]["Enums"]["field_type"][number];
  // Add other field properties as needed
};

export type FieldItemProps = {
  field: Field;
  passive?: boolean;
  disabled?: boolean;
  minHeight?: number;
  minWidth?: number;
  onResize?: (_node: HTMLElement) => void;
  onMove?: (_node: HTMLElement) => void;
  onRemove?: () => void;
};

export const FieldItem = ({
  field,
  passive,
  disabled,
  onResize,
  onMove,
  onRemove,
}: FieldItemProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: 0,
    pageWidth: 0,
  });

  const calculateCoords = useCallback(() => {
    const $page = document.querySelector<HTMLElement>(
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`
    );

    if (!$page) {
      return;
    }

    const { height, width } = $page.getBoundingClientRect();

    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;

    // X and Y are percentages of the page's height and width
    const pageX = (field.pageX / 100) * width + left;
    const pageY = (field.pageY / 100) * height + top;

    const pageHeight = (field.pageHeight / 100) * height;
    const pageWidth = (field.pageWidth / 100) * width;

    setCoords({
      pageX: pageX,
      pageY: pageY,
      pageHeight: pageHeight,
      pageWidth: pageWidth,
    });
  }, [
    field.pageHeight,
    field.pageNumber,
    field.pageWidth,
    field.pageX,
    field.pageY,
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

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <Rnd
      key={coords.pageX + coords.pageY + coords.pageHeight + coords.pageWidth}
      className={cn("z-20 group", {
        "pointer-events-none": passive,
        "pointer-events-none opacity-75": disabled,
        "z-10": !active || disabled,
      })}
      // minHeight={minHeight}
      // minWidth={minWidth}
      default={{
        x: coords.pageX,
        y: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
      }}
      bounds={`${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`}
      onDragStart={() => setActive(true)}
      onResizeStart={() => setActive(true)}
      onResizeStop={(_e, _d, ref) => {
        setActive(false);
        onResize?.(ref);
      }}
      onDragStop={(_e, d) => {
        setActive(false);
        onMove?.(d.node);
      }}
    >
      {!disabled && (
        <button
          className="w-8 h-8 cursor-pointer text-muted-foreground/50 hover:text-muted-foreground/80 bg-background absolute -right-2 top-6 z-20 flex items-center justify-center rounded-full border"
          onClick={() => onRemove?.()}
          onTouchEnd={() => onRemove?.()}
        >
          <Trash className="h-4 w-4" />
        </button>
      )}

      <Card
        className={cn("bg-field-card/80 h-full w-full backdrop-blur-[1px]", {
          "border-field-card-border": !disabled,
          "border-field-card-border/80": active,
        })}
      >
        <CardContent
          className={cn(
            "text-field-card-foreground flex flex-col items-center justify-center p-2 border-2 bg-white border-green-500 w-28 h-8 rounded-md text-sm font-medium",
            {
              "text-field-card-foreground/50": disabled,
              "font-tangerine text-3xl h-12": field.type === "signature",
            }
          )}
        >
          {FRIENDLY_FIELD_TYPE[field.type]}

          {/* <p className="w-full truncate text-center text-xs">
            {field.signerEmail}
          </p> */}
        </CardContent>
      </Card>
    </Rnd>,
    document.body
  );
};
