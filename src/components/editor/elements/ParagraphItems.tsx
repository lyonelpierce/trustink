"use client";

import { Rnd } from "react-rnd";
import { cn } from "@/lib/utils";
import { PencilIcon, Trash } from "lucide-react";
import { createPortal } from "react-dom";
import { Database } from "../../../../database.types";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { AutosizeTextarea } from "@/components/ui/resizableTextarea";

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
  const { session } = useSession();
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: defaultHeight || 0,
    pageWidth: defaultWidth || 0,
    pageScale: 1,
  });
  const $el = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(paragraph.text);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      // Move caret to end
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const autoResizeTextarea = () => {
    if (editableRef.current) {
      editableRef.current.style.height = "auto";
      editableRef.current.style.height = `${editableRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      autoResizeTextarea();
    }
  }, [isEditing, editText]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect?.();
  };

  const createClerkSupabaseClient = () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }
    );
  };
  const supabase = createClerkSupabaseClient();

  const debouncedSave = useDebouncedCallback(async (newText: string) => {
    if (newText !== paragraph.text) {
      await supabase
        .from("documents_lines")
        .update({ text: newText })
        .eq("id", paragraph.id);
    }
  }, 500);

  return createPortal(
    <>
      <Rnd
        key={coords.pageX + coords.pageY + coords.pageHeight + coords.pageWidth}
        className={cn("group", {
          "pointer-events-none": passive,
          "editing-cursor-text": isEditing,
        })}
        default={{
          x: coords.pageX,
          y: coords.pageY,
          height: coords.pageHeight,
          width: coords.pageWidth + 10,
        }}
        minHeight={minHeight || "auto"}
        minWidth={minWidth || "auto"}
        enableResizing={false}
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
        disableDragging={isEditing}
      >
        <div
          ref={$el}
          data-field-id={paragraph.id}
          style={{
            overflow: "visible",
            fontSize:
              paragraph.size && coords.pageScale
                ? `${paragraph.size * coords.pageScale}px`
                : paragraph.size
                ? `${paragraph.size}px`
                : undefined,
            fontStyle: paragraph.style === "italic" ? "italic" : undefined,
            fontWeight: paragraph.style === "bold" ? "bold" : undefined,
            cursor: isEditing ? "text" : "move",
          }}
          className="hover:outline-2 hover:outline-dashed hover:outline-gray-300 rounded"
        >
          {isEditing ? (
            <>
              <AutosizeTextarea
                value={editText}
                onChange={(e) => {
                  const newText = e.target.value;
                  setEditText(newText);
                  debouncedSave(newText);
                }}
                minHeight={20}
                onBlur={async (e) => {
                  setIsEditing(false);
                  const newText = e.target.value;
                  setEditText(newText);
                  debouncedSave.flush(); // flush pending debounce
                  if (newText !== paragraph.text) {
                    await supabase
                      .from("documents_lines")
                      .update({ text: newText })
                      .eq("id", paragraph.id);
                  }
                  // --- Height update logic ---
                  if (textareaRef.current) {
                    const newPxHeight = textareaRef.current.scrollHeight;
                    // Find the PDF page element
                    const $page = document.querySelector<HTMLElement>(
                      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${paragraph.page_number}"]`
                    );
                    if ($page) {
                      const pageHeightPx = $page.getBoundingClientRect().height;
                      if (pageHeightPx > 0) {
                        const newHeightPercent =
                          (newPxHeight / pageHeightPx) * 100;
                        // Only update if changed by at least 0.1%
                        if (
                          Math.abs(newHeightPercent - paragraph.height) > 0.1
                        ) {
                          await supabase
                            .from("documents_lines")
                            .update({ height: newHeightPercent })
                            .eq("id", paragraph.id);
                        }
                      }
                    }
                  }
                }}
                rows={1}
                style={{
                  minWidth: 30,
                  minHeight: 8,
                  fontSize:
                    paragraph.size && coords.pageScale
                      ? `${paragraph.size * coords.pageScale}px`
                      : paragraph.size
                      ? `${paragraph.size}px`
                      : undefined,
                  fontStyle:
                    paragraph.style === "italic" ? "italic" : undefined,
                  fontWeight: paragraph.style === "bold" ? "bold" : undefined,
                  resize: "none",
                  overflow: "hidden",
                }}
                autoFocus
                className="resize-none p-0 focus-visible:ring-0 border-0"
              />
            </>
          ) : (
            <div
              ref={editableRef}
              style={{
                outline: "none",
                minWidth: 30,
                display: "inline-block",
                whiteSpace: "pre-line",
              }}
            >
              {editText}
            </div>
          )}
          {isSelected && (
            <div className="z-[60] flex justify-center items-center absolute -top-6 right-0">
              <div className="dark:bg-background group flex items-center justify-evenly gap-x-1 rounded-md border bg-gray-900 p-0.5">
                <button
                  className="cursor-pointer dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
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
      </Rnd>
      {isEditing && (
        <style jsx global>{`
          .editing-cursor-text,
          .editing-cursor-text * {
            cursor: text !important;
          }
        `}</style>
      )}
    </>,
    document.body
  );
};
