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
import React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FieldItem } from "./FieldItem";
import { useSession } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { ParagraphItem } from "./ParagraphItems";
import { CardContent } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../../database.types";
import { FRIENDLY_FIELD_TYPE } from "@/constants/FieldTypes";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useDocumentElement } from "@/hooks/useDocumentElement";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBoundingClientRect } from "@/hooks/get-bounding-client-rect";
import { useSelectedRecipientStore } from "@/store/SelectedRecipientStore";

const MIN_HEIGHT_PX = 12;
const MIN_WIDTH_PX = 36;

const DEFAULT_HEIGHT_PX = MIN_HEIGHT_PX * 2.5;
const DEFAULT_WIDTH_PX = MIN_WIDTH_PX * 2.5;

type FieldType = Database["public"]["Enums"]["field_type"];

export type FieldFormType = {
  nativeId?: number;
  formId: string;
  secondary_id: string;
  pageNumber: number;
  type: FieldType;
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
  recipient_id: string;
};

const Elements = ({
  fields,
  documentId,
  isDocumentPdfLoaded,
  documentUrl,
}: {
  fields: (Database["public"]["Tables"]["fields"]["Row"] & {
    recipients: {
      id: string;
      email: string;
      color: string;
    };
  })[];
  documentId: string;
  isDocumentPdfLoaded: boolean;
  documentUrl: string;
}) => {
  const { session } = useSession();
  const { getPage, isWithinPageBounds, getFieldPosition } =
    useDocumentElement();

  const [currentFields, setCurrentFields] = useState<
    (Database["public"]["Tables"]["fields"]["Row"] & {
      recipients: {
        id: string;
        email: string;
        color: string;
      };
    })[]
  >(fields);

  const [currentLines, setCurrentLines] = useState<
    Database["public"]["Tables"]["documents_lines"]["Row"][]
  >([]);

  // State for document paragraphs - will be used for text analysis and field positioning
  const [documentParagraphs, setDocumentParagraphs] = useState<
    Database["public"]["Tables"]["documents_lines"]["Row"][]
  >([]);

  const { selectedRecipient } = useSelectedRecipientStore();

  const [selectedField, setSelectedField] = useState<FieldType | null>(null);

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

  // Add a state to track if the backend API call has been made for this document
  const [hasCalledBackend, setHasCalledBackend] = useState(false);

  const createClerkSupabaseClient = useCallback(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }
    );
  }, [session]);

  const client = createClerkSupabaseClient();

  useEffect(() => {
    const client = createClerkSupabaseClient();

    // Subscribe to fields changes
    const fieldsChannel = client
      .channel("fields")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fields",
          filter: `document_id=eq.${documentId}`,
        },
        async (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            // Fetch the full field data including recipients
            const { data: fieldWithRecipient } = (await client
              .from("fields")
              .select(
                `
                *,
                recipients:fields_recipient_id_fkey (
                  id,
                  email,
                  color
                )
              `
              )
              .eq("id", payload.new.id)
              .single()) as unknown as {
              data: Database["public"]["Tables"]["fields"]["Row"] & {
                recipients: {
                  id: string;
                  email: string;
                  color: string;
                };
              };
            };

            if (fieldWithRecipient) {
              if (payload.eventType === "INSERT") {
                setCurrentFields((prev) => [...prev, fieldWithRecipient]);
              } else {
                setCurrentFields((prev) =>
                  prev.map((field) =>
                    field.id === fieldWithRecipient.id
                      ? fieldWithRecipient
                      : field
                  )
                );
              }
            }
          } else if (payload.eventType === "DELETE") {
            setCurrentFields((prev) =>
              prev.filter((field) => field.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to document_text_paragraphs changes
    const paragraphsChannel = client
      .channel("documents_lines")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents_lines",
          filter: `document_id=eq.${documentId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newParagraph =
              payload.new as Database["public"]["Tables"]["documents_lines"]["Row"];
            setDocumentParagraphs((prev) => [...prev, newParagraph]);
            setCurrentLines((prev) => [...prev, newParagraph]);
          } else if (payload.eventType === "UPDATE") {
            const updatedParagraph =
              payload.new as Database["public"]["Tables"]["documents_lines"]["Row"];
            setDocumentParagraphs((prev) =>
              prev.map((paragraph) =>
                paragraph.id === updatedParagraph.id
                  ? updatedParagraph
                  : paragraph
              )
            );
            setCurrentLines((prev) =>
              prev.map((line) =>
                line.id === updatedParagraph.id ? updatedParagraph : line
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldParagraph =
              payload.old as Database["public"]["Tables"]["documents_lines"]["Row"];
            setDocumentParagraphs((prev) =>
              prev.filter((paragraph) => paragraph.id !== oldParagraph.id)
            );
            setCurrentLines((prev) =>
              prev.filter((line) => line.id !== oldParagraph.id)
            );
          }
        }
      )
      .subscribe();

    // Initial fetch of document_text_paragraphs
    const fetchParagraphs = async () => {
      const { data: paragraphs, error } = await client
        .from("documents_lines")
        .select("*")
        .eq("document_id", documentId);

      if (error) {
        console.error("Error fetching paragraphs:", error);
        return;
      }

      // Only set state if paragraphs is an array (could be empty)
      if (Array.isArray(paragraphs)) {
        setDocumentParagraphs(paragraphs);
        setCurrentLines(paragraphs); // Keep currentLines in sync initially

        // --- Fetch document status and call backend API if needed ---
        try {
          const { data: doc, error: docError } = await client
            .from("documents")
            .select("status")
            .eq("id", documentId)
            .maybeSingle();

          if (docError) {
            console.error("Error fetching document status:", docError);
            return;
          }
          if (
            doc &&
            doc.status === "uploaded" &&
            session?.user?.id &&
            documentUrl &&
            !hasCalledBackend
          ) {
            // Call backend API
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                pdf_url: documentUrl,
                user_id: session.user.id,
                document_id: documentId,
              }),
            });
            setHasCalledBackend(true);
          } else {
            // No document found or status is not 'uploaded', do nothing
          }
        } catch (err) {
          console.error("Error in post-fetch status/API logic:", err);
        }
        // --- End status check and API call ---
      }
    };

    fetchParagraphs();

    return () => {
      fieldsChannel.unsubscribe();
      paragraphsChannel.unsubscribe();
    };
  }, [
    documentId,
    createClerkSupabaseClient,
    session?.user?.id,
    documentUrl,
    hasCalledBackend,
  ]);

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

      // Calculate x and y as a percentage of the page width and height
      let pageX = ((event.pageX - left) / width) * 100;
      let pageY = ((event.pageY - top) / height) * 100;

      // Get the bounds as a percentage of the page width and height
      const fieldPageWidth = (fieldBounds.current.width / width) * 100;
      const fieldPageHeight = (fieldBounds.current.height / height) * 100;

      // And center it based on the bounds
      pageX -= fieldPageWidth / 2;
      pageY -= fieldPageHeight / 2;

      try {
        const { data, error } = await client
          .from("fields")
          .insert({
            type: selectedField,
            user_id: session?.user.id,
            document_id: documentId,
            page: pageNumber,
            position_x: pageX,
            position_y: pageY,
            height: fieldPageHeight,
            width: fieldPageWidth,
            recipient_id: selectedRecipient?.id,
          })
          .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("No data returned");

        setIsFieldWithinBounds(false);
        setSelectedField(null);
      } catch (error) {
        toast.error("Error saving field");
        console.error("Error saving field:", error);
        // You might want to show an error toast here
      }
    },
    [
      isWithinPageBounds,
      selectedField,
      getPage,
      client,
      documentId,
      session?.user.id,
      selectedRecipient?.id,
    ]
  );

  const onFieldResize = useCallback(
    async (node: HTMLElement, index: number) => {
      const field = currentFields[index];

      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.page}"]`
      );

      if (!$page) {
        return;
      }

      const {
        x: pageX,
        y: pageY,
        width: pageWidth,
        height: pageHeight,
      } = getFieldPosition($page, node);

      try {
        // Update the database
        const { error } = await client
          .from("fields")
          .update({
            position_x: pageX,
            position_y: pageY,
            width: pageWidth,
            height: pageHeight,
          })
          .eq("secondary_id", field.secondary_id);

        if (error) throw error;

        // Update local state
      } catch (error) {
        console.error("Error updating field position and size:", error);
      }
    },
    [getFieldPosition, client, currentFields]
  );

  const onFieldMove = useCallback(
    async (node: HTMLElement, index: number) => {
      const field = currentFields[index];

      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.page}"]`
      );

      if (!$page) {
        return;
      }

      const { x: pageX, y: pageY } = getFieldPosition($page, node);

      try {
        // Update the database
        const { error } = await client
          .from("fields")
          .update({
            position_x: pageX,
            position_y: pageY,
          })
          .eq("secondary_id", field.secondary_id);

        if (error) throw error;

        // Update local state
      } catch (error) {
        console.error("Error updating field position:", error);
      }
    },
    [getFieldPosition, client, currentFields]
  );

  // Add new handler for field removal
  const handleFieldRemove = useCallback(
    async (index: number) => {
      if (isDeletingField) return; // Prevent multiple simultaneous deletions

      const field = currentFields[index];

      try {
        setIsDeletingField(true);

        const { error } = await client
          .from("fields")
          .delete()
          .eq("secondary_id", field.secondary_id);

        if (error) throw error;
      } catch (error) {
        console.error("Error removing field:", error);
      } finally {
        setIsDeletingField(false);
      }
    },
    [client, currentFields, isDeletingField]
  );

  // Handler for paragraph removal
  const handleParagraphRemove = useCallback(
    async (index: number) => {
      if (isDeletingParagraph) return; // Prevent multiple simultaneous deletions

      const paragraph = currentLines[index];

      try {
        setIsDeletingParagraph(true);
        const { error } = await client
          .from("documents_lines")
          .delete()
          .eq("id", paragraph.id);
        if (error) throw error;
        // Optimistically update UI
        setDocumentParagraphs((prev) =>
          prev.filter((p) => p.id !== paragraph.id)
        );
        setCurrentLines((prev) => prev.filter((l) => l.id !== paragraph.id));
      } catch (error) {
        console.error("Error removing paragraph:", error);
      } finally {
        setIsDeletingParagraph(false);
      }
    },
    [client, currentLines, isDeletingParagraph]
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
      const line = currentLines[index];

      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${line.page_number}"]`
      );

      if (!$page) return;

      const { x: pageX, y: pageY } = getFieldPosition($page, node);

      try {
        await client
          .from("documents_lines")
          .update({
            position_x: pageX,
            position_y: pageY,
          })
          .eq("id", line.id);
      } catch (error) {
        console.error("Error updating paragraph position:", error);
      }
    },
    [client, getFieldPosition, currentLines]
  );

  // Reset hasCalledBackend if documentId changes
  useEffect(() => {
    setHasCalledBackend(false);
  }, [documentId]);

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
            {FRIENDLY_FIELD_TYPE[selectedField as FieldType]}
          </span>
        </div>
      )}

      {isDocumentPdfLoaded && isPdfReady && (
        <>
          {currentFields.map((field, index) => (
            <FieldItem
              key={index}
              field={field}
              disabled={
                !selectedRecipient ||
                field.recipient_id !== selectedRecipient.id
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
          {documentParagraphs.map((paragraph, index) => (
            <ParagraphItem
              key={paragraph.id}
              paragraph={paragraph}
              minHeight={MIN_HEIGHT_PX}
              minWidth={MIN_WIDTH_PX}
              defaultHeight={DEFAULT_HEIGHT_PX}
              defaultWidth={DEFAULT_WIDTH_PX}
              isSelected={selectedParagraph === paragraph.id}
              onSelect={() => setSelectedParagraph(paragraph.id)}
              onMove={(node) => onLineMove(node, index)}
              onRemove={() => handleParagraphRemove(index)}
              passive={!!selectedRecipient}
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
            onClick={() => setSelectedField("signature" as FieldType)}
            onMouseDown={() => setSelectedField("signature" as FieldType)}
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
            onClick={() => setSelectedField("initials" as FieldType)}
            onMouseDown={() => setSelectedField("initials" as FieldType)}
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
            onClick={() => setSelectedField("email" as FieldType)}
            onMouseDown={() => setSelectedField("email" as FieldType)}
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
            onClick={() => setSelectedField("name" as FieldType)}
            onMouseDown={() => setSelectedField("name" as FieldType)}
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
            onClick={() => setSelectedField("date" as FieldType)}
            onMouseDown={() => setSelectedField("date" as FieldType)}
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
            onClick={() => setSelectedField("text" as FieldType)}
            onMouseDown={() => setSelectedField("text" as FieldType)}
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
            onClick={() => setSelectedField("radio" as FieldType)}
            onMouseDown={() => setSelectedField("radio" as FieldType)}
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
            onClick={() => setSelectedField("checkbox" as FieldType)}
            onMouseDown={() => setSelectedField("checkbox" as FieldType)}
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
