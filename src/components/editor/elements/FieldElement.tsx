"use client";

import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { Trash } from "lucide-react";
import { createPortal } from "react-dom";
import { Database } from "../../../../database.types";
import { Card, CardContent } from "@/components/ui/card";
import { FRIENDLY_FIELD_TYPE } from "@/constants/FieldTypes";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useCallback, useEffect, useRef, useState } from "react";

export type FieldItemProps = {
  field: Database["public"]["Tables"]["fields"]["Row"];
  passive?: boolean;
  disabled?: boolean;
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
  onResize?: (_node: HTMLElement) => void;
  onMove?: (_node: HTMLElement) => void;
  onRemove?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  active?: boolean;
  onFieldDeactivate?: () => void;
  onFieldActivate?: () => void;
};

export const FieldItem = ({
  field,
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
  onBlur,
  onFocus,
}: FieldItemProps) => {
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: defaultHeight || 0,
    pageWidth: defaultWidth || 0,
  });
  const [settingsActive, setSettingsActive] = useState(false);
  const $el = useRef(null);

  const calculateCoords = useCallback(() => {
    const $page = document.querySelector<HTMLElement>(
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.page}"]`
    );

    if (!$page) {
      return;
    }

    const { height, width } = $page.getBoundingClientRect();

    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;

    // X and Y are percentages of the page's height and width
    const pageX = (field.position_x / 100) * width + left;
    const pageY = (field.position_y / 100) * height + top;

    const pageHeight = (field.height / 100) * height;
    const pageWidth = (field.width / 100) * width;

    setCoords({
      pageX: pageX,
      pageY: pageY,
      pageHeight: pageHeight,
      pageWidth: pageWidth,
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

  useEffect(() => {
    const onClickOutsideOfField = (event: MouseEvent) => {
      const isOutsideOfField =
        $el.current && !event.composedPath().includes($el.current);

      setSettingsActive((active) => {
        if (active && isOutsideOfField) {
          return false;
        }

        return active;
      });

      if (isOutsideOfField) {
        setSettingsActive(false);
        onFieldDeactivate?.();
        onBlur?.();
      }
    };

    document.body.addEventListener("click", onClickOutsideOfField);

    return () => {
      document.body.removeEventListener("click", onClickOutsideOfField);
    };
  }, [onBlur, onFieldDeactivate]);

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
      // minHeight={minHeight}
      // minWidth={minWidth}
      default={{
        x: coords.pageX,
        y: coords.pageY,
        height: coords.pageHeight,
        width: coords.pageWidth,
      }}
      minHeight={minHeight || "auto"}
      minWidth={minWidth || "auto"}
      bounds={`${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.page}"]`}
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
    >
      <Card
        className={cn("bg-field-card/80 h-full w-full backdrop-blur-[1px]", {
          "border-field-card-border": !disabled,
          "border-none": active,
        })}
        onClick={(e) => {
          e.stopPropagation();
          setSettingsActive((prev) => !prev);
          onFieldActivate?.();
          onFocus?.();
        }}
        ref={$el}
        data-field-id={field.id}
        style={{
          boxShadow: field.color ? `0 0 0 2px ${field.color}` : "none",
        }}
      >
        <CardContent
          className={cn(
            "text-field-card-foreground flex flex-col items-center justify-center p-2 bg-white w-full h-full rounded-md text-sm font-medium transition-all duration-300 ease-in-out",
            {
              "text-field-card-foreground/50": disabled,
              "font-tangerine text-3xl": field.type === "signature",
            }
          )}
        >
          {FRIENDLY_FIELD_TYPE[field.type]}

          {/* <p className="w-full truncate text-center text-xs">
            {field.signerEmail}
          </p> */}
        </CardContent>
      </Card>

      {!disabled && settingsActive && (
        <div className="z-[60] mt-1 flex justify-center">
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
