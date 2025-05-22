"use client";

import {
  MailIcon,
  TypeIcon,
  User2Icon,
  Calendar1Icon,
  SignatureIcon,
  CaseUpperIcon,
  // CircleDotIcon,
  // SquareCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LineItem } from "./LineItem";
import { FieldItem } from "./FieldItem";
import { useMutation } from "convex/react";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { api } from "../../../../convex/_generated/api";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useDocumentElement } from "@/hooks/useDocumentElement";
import { useCallback, useEffect, useRef, useState } from "react";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { getBoundingClientRect } from "@/hooks/get-bounding-client-rect";
import { useSelectedRecipientStore } from "@/store/SelectedRecipientStore";

const MIN_HEIGHT_PX = 12;
const MIN_WIDTH_PX = 36;

const DEFAULT_HEIGHT_PX = MIN_HEIGHT_PX * 2.5;
const DEFAULT_WIDTH_PX = MIN_WIDTH_PX * 2.5;

export type FieldFormType = {
  nativeId?: number;
  formId: string;
  secondary_id: string;
  pageNumber: number;
  type: string;
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
  recipient_id: string;
};

const FRIENDLY_FIELD_TYPE: Record<Doc<"fields">["type"], string> = {
  signature: "Signature",
  initials: "Initials",
  email: "Email",
  name: "Name",
  date: "Date",
  text: "Text",
};

const Elements = ({
  documentId,
  isDocumentPdfLoaded,
  currentLines,
  currentFields,
  recipients,
}: {
  documentId: string;
  isDocumentPdfLoaded: boolean;
  currentLines: Doc<"lines">[];
  currentFields: Doc<"fields">[];
  recipients: Doc<"recipients">[];
}) => {
  const { getPage, isWithinPageBounds, getFieldPosition } =
    useDocumentElement();

  // const [currentLines, setCurrentLines] = useState<Doc<"lines">[]>(lines);

  const { selectedRecipient } = useSelectedRecipientStore();

  const [selectedField, setSelectedField] = useState<
    Doc<"fields">["type"] | null
  >(null);

  // Add state for selected paragraph
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(
    null
  );

  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
  });

  const fieldBounds = useRef({
    height: 0,
    width: 0,
  });

  // Add a state to track if a field is being deleted
  const [isDeletingField, setIsDeletingField] = useState(false);

  // Add this new state to track PDF readiness
  const [isPdfReady, setIsPdfReady] = useState(false);

  // Add a state to track if a paragraph is being deleted
  const [isDeletingParagraph, setIsDeletingParagraph] = useState(false);

  // Enrich fields with recipient data
  const fieldsWithRecipients = currentFields.map((field) => {
    const recipient = recipients.find((r) => r._id === field.recipient_id);
    return {
      ...field,
      recipients: recipient
        ? {
            id: recipient._id,
            email: recipient.email,
            color: recipient.color || "",
          }
        : { id: "", email: "", color: "" },
    };
  });

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      setIsFieldWithinBounds(
        isWithinPageBounds(
          event,
          PDF_VIEWER_PAGE_SELECTOR,
          fieldBounds.current.width,
          fieldBounds.current.height
        )
      );

      setCoords({
        x: event.clientX - fieldBounds.current.width / 2,
        y: event.clientY - fieldBounds.current.height / 2,
      });
    },
    [isWithinPageBounds]
  );

  // Convex mutations
  const addField = useMutation(api.fields.addField);
  const updateField = useMutation(api.fields.updateField);
  const removeField = useMutation(api.fields.removeField);

  const onMouseClick = useCallback(
    async (event: MouseEvent) => {
      if (!selectedField) return;
      const $page = getPage(event, PDF_VIEWER_PAGE_SELECTOR);
      if (
        !$page ||
        !isWithinPageBounds(
          event,
          PDF_VIEWER_PAGE_SELECTOR,
          fieldBounds.current.width,
          fieldBounds.current.height
        )
      ) {
        setSelectedField(null);
        return;
      }
      const { top, left, height, width } = getBoundingClientRect($page);
      const pageNumber = parseInt(
        $page.getAttribute("data-page-number") ?? "1",
        10
      );
      let pageX = ((event.pageX - left) / width) * 100;
      let pageY = ((event.pageY - top) / height) * 100;
      const fieldPageWidth = (fieldBounds.current.width / width) * 100;
      const fieldPageHeight = (fieldBounds.current.height / height) * 100;
      pageX -= fieldPageWidth / 2;
      pageY -= fieldPageHeight / 2;
      try {
        await addField({
          document_id: documentId as Id<"documents">,
          page: pageNumber,
          position_x: pageX,
          position_y: pageY,
          width: fieldPageWidth,
          height: fieldPageHeight,
          type: selectedField,
          recipient_id: selectedRecipient?._id,
          secondary_id: undefined,
        });
        setIsFieldWithinBounds(false);
        setSelectedField(null);
      } catch (error) {
        toast.error("Error saving field");
        console.error("Error saving field:", error);
      }
    },
    [
      isWithinPageBounds,
      selectedField,
      getPage,
      documentId,
      selectedRecipient?._id,
      addField,
    ]
  );

  const onFieldResize = useCallback(
    async (node: HTMLElement, index: number) => {
      const field = currentFields[index];
      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.page}"]`
      );
      if (!$page) return;
      const {
        x: pageX,
        y: pageY,
        width: pageWidth,
        height: pageHeight,
      } = getFieldPosition($page, node);
      try {
        await updateField({
          field_id: field._id,
          position_x: pageX,
          position_y: pageY,
          width: pageWidth,
          height: pageHeight,
        });
      } catch (error) {
        console.error("Error updating field position and size:", error);
      }
    },
    [getFieldPosition, currentFields, updateField]
  );

  const onFieldMove = useCallback(
    async (node: HTMLElement, index: number) => {
      const field = currentFields[index];
      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.page}"]`
      );
      if (!$page) return;
      const { x: pageX, y: pageY } = getFieldPosition($page, node);
      try {
        await updateField({
          field_id: field._id,
          position_x: pageX,
          position_y: pageY,
        });
      } catch (error) {
        console.error("Error updating field position:", error);
      }
    },
    [getFieldPosition, currentFields, updateField]
  );

  const handleFieldRemove = useCallback(
    async (index: number) => {
      if (isDeletingField) return;
      const field = currentFields[index];
      try {
        setIsDeletingField(true);
        await removeField({ field_id: field._id });
      } catch (error) {
        console.error("Error removing field:", error);
      } finally {
        setIsDeletingField(false);
      }
    },
    [currentFields, isDeletingField, removeField]
  );

  // Handler for paragraph removal
  const removeLine = useMutation(api.lines.removeLine);
  const moveLine = useMutation(api.lines.moveLine);
  const updateLine = useMutation(api.lines.updateLine);

  const handleLineRemove = useCallback(
    async (index: number) => {
      if (isDeletingParagraph) return; // Prevent multiple simultaneous deletions

      const paragraph = currentLines[index];
      console.log("Attempting to remove paragraph:", paragraph);

      try {
        setIsDeletingParagraph(true);
        await removeLine({ line_id: paragraph._id });
      } catch (error) {
        console.error("Error removing paragraph:", error);
        toast.error("Error removing paragraph: " + (error as Error).message);
      } finally {
        setIsDeletingParagraph(false);
      }
    },
    [currentLines, isDeletingParagraph, removeLine]
  );

  useEffect(() => {
    if (selectedField) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseClick);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseClick);
    };
  }, [onMouseClick, onMouseMove, selectedField]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const $page = document.querySelector(PDF_VIEWER_PAGE_SELECTOR);

      if (!$page) {
        return;
      }

      // Check if the PDF page has actual dimensions
      const { height, width } = $page.getBoundingClientRect();
      if (height > 0 && width > 0) {
        setIsPdfReady(true);

        fieldBounds.current = {
          height: Math.max(DEFAULT_HEIGHT_PX),
          width: Math.max(DEFAULT_WIDTH_PX),
        };
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true, // Also observe attribute changes
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Click outside handler to deselect paragraphs
    const handleClickOutside = (e: MouseEvent) => {
      // Check if the click is on a paragraph item
      const isParagraphClick = (e.target as HTMLElement).closest(
        "[data-field-id]"
      );
      if (!isParagraphClick) {
        setSelectedParagraph(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add this above the return in the Elements component
  const onLineMove = useCallback(
    async (node: HTMLElement, index: number) => {
      // Find the page element for this paragraph
      const line = currentLines?.[index];

      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${line?.page_number}"]`
      );

      if (!$page || !line) return;

      const { x: pageX, y: pageY } = getFieldPosition($page, node);

      try {
        await moveLine({
          line_id: line._id,
          position_x: pageX,
          position_y: pageY,
        });
      } catch (error) {
        console.error("Error updating paragraph position:", error);
      }
    },
    [getFieldPosition, currentLines, moveLine]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <p className="text-lg font-medium">3. Fields</p>
        <p className="text-xs text-gray-500">
          {!selectedRecipient
            ? "Select a recipient to add fields for them."
            : "Add fields to the document to collect information from the signers."}
        </p>
      </div>
      {selectedField && (
        <div
          className={cn(
            "text-muted-foreground border-2 rounded-md dark:text-muted-background pointer-events-none fixed z-50 flex cursor-pointer flex-col items-center justify-center bg-white transition transition-discrete duration-200 [container-type:size]",
            {
              "-rotate-6 scale-90 rounded-md border-red-500 opacity-50 dark:bg-black/20":
                !isFieldWithinBounds,
              "dark:text-black/60": isFieldWithinBounds,
            }
          )}
          style={{
            top: coords.y,
            left: coords.x,
            height: fieldBounds.current.height,
            width: fieldBounds.current.width,
            ...(isFieldWithinBounds && selectedRecipient?.color
              ? { border: `2px solid ${selectedRecipient.color}` }
              : {}),
          }}
        >
          <span className="text-[clamp(0.425rem,25cqw,0.825rem)]">
            {FRIENDLY_FIELD_TYPE[selectedField as Doc<"fields">["type"]]}
          </span>
        </div>
      )}

      {isDocumentPdfLoaded && isPdfReady && (
        <>
          {fieldsWithRecipients.map((field, index) => (
            <FieldItem
              key={field._id}
              field={field}
              disabled={
                !selectedRecipient ||
                field.recipient_id !== selectedRecipient._id
              }
              minHeight={MIN_HEIGHT_PX}
              minWidth={MIN_WIDTH_PX}
              defaultHeight={DEFAULT_HEIGHT_PX}
              defaultWidth={DEFAULT_WIDTH_PX}
              passive={isFieldWithinBounds && !!selectedField}
              active={selectedField === field.type}
              onResize={(node) => onFieldResize(node, index)}
              onMove={(node) => onFieldMove(node, index)}
              onRemove={() => handleFieldRemove(index)}
            />
          ))}
          {currentLines?.map((line, index) => (
            <LineItem
              key={line._id}
              paragraph={line}
              minHeight={MIN_HEIGHT_PX}
              minWidth={MIN_WIDTH_PX}
              defaultHeight={DEFAULT_HEIGHT_PX}
              defaultWidth={DEFAULT_WIDTH_PX}
              isSelected={selectedParagraph === line._id}
              onSelect={() => setSelectedParagraph(line._id)}
              onMove={(node) => onLineMove(node, index)}
              onRemove={() => handleLineRemove(index)}
              passive={!!selectedRecipient}
              onUpdateLine={updateLine}
            />
          ))}
        </>
      )}
      <div className="flex-1 overflow-y-auto px-2">
        <fieldset
          className="flex flex-col w-full gap-4"
          disabled={!selectedRecipient}
        >
          <button
            type="button"
            className="group h-full w-full"
            onClick={() =>
              setSelectedField("signature" as Doc<"fields">["type"])
            }
            onMouseDown={() =>
              setSelectedField("signature" as Doc<"fields">["type"])
            }
            data-selected={selectedField === "signature" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "signature",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <SignatureIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-center text-xs">
                  Signature
                </p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            className="group h-full w-full"
            onClick={() =>
              setSelectedField("initials" as Doc<"fields">["type"])
            }
            onMouseDown={() =>
              setSelectedField("initials" as Doc<"fields">["type"])
            }
            data-selected={selectedField === "initials" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "initials",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <CaseUpperIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-center text-xs">
                  Initials
                </p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            className="group h-full w-full"
            onClick={() => setSelectedField("email" as Doc<"fields">["type"])}
            onMouseDown={() =>
              setSelectedField("email" as Doc<"fields">["type"])
            }
            data-selected={selectedField === "email" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "email",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <MailIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Email</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            className="group h-full w-full"
            onClick={() => setSelectedField("name" as Doc<"fields">["type"])}
            onMouseDown={() =>
              setSelectedField("name" as Doc<"fields">["type"])
            }
            data-selected={selectedField === "name" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "name",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <User2Icon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Name</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            className="group h-full w-full"
            onClick={() => setSelectedField("date" as Doc<"fields">["type"])}
            onMouseDown={() =>
              setSelectedField("date" as Doc<"fields">["type"])
            }
            data-selected={selectedField === "date" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "date",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <Calendar1Icon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Date</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            className="group h-full w-full"
            onClick={() => setSelectedField("text" as Doc<"fields">["type"])}
            onMouseDown={() =>
              setSelectedField("text" as Doc<"fields">["type"])
            }
            data-selected={selectedField === "text" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "text",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <TypeIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Text</p>
              </CardContent>
            </Card>
          </button>

          {/* <button
            type="button"
            className="group h-full w-full"
            onClick={() => setSelectedField("radio" as Doc<"fields">["type"])}
            onMouseDown={() => setSelectedField("radio" as Doc<"fields">["type"])}
            data-selected={selectedField === "radio" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "radio",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <CircleDotIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Radio</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            className="group h-full w-full"
            onClick={() => setSelectedField("checkbox" as Doc<"fields">["type"])}
            onMouseDown={() => setSelectedField("checkbox" as Doc<"fields">["type"])}
            data-selected={selectedField === "checkbox" ? true : undefined}
          >
            <Card
              className={cn(
                "group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50 transition-all duration-300 hover:bg-muted",
                {
                  "bg-muted": selectedField === "checkbox",
                }
              )}
            >
              <CardContent className="flex flex-col items-center justify-center px-6 py-3">
                <SquareCheckIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Checkbox</p>
              </CardContent>
            </Card>
          </button> */}
        </fieldset>
      </div>
    </div>
  );
};

export default Elements;
