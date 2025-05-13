"use client";

import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { FieldItem } from "./FieldElement";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "../../../../database.types";
import { FRIENDLY_FIELD_TYPE } from "@/constants/FieldTypes";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useDocumentElement } from "@/hooks/useDocumentElement";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBoundingClientRect } from "@/hooks/get-bounding-client-rect";
import { useSelectedRecipientStore } from "@/store/SelectedRecipientStore";
import { Button } from "@/components/ui/button";
import ViewerParagraphItem from "./ParagraphItem";

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  initials: z.string().min(1).optional(),
});

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
  recipients,
}: {
  fields: (Database["public"]["Tables"]["fields"]["Row"] & {
    recipients: {
      id: string;
      email: string;
      color: string;
      signer_id: string;
    };
  })[];
  documentId: string;
  isDocumentPdfLoaded: boolean;
  recipients: {
    id: string;
    email: string;
    color: string;
    signer_id: string;
  }[];
}) => {
  const { userId } = useAuth();
  const { session } = useSession();
  const { getPage, isWithinPageBounds } = useDocumentElement();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      initials: "",
    },
  });

  const [currentFields, setCurrentFields] = useState<
    (Database["public"]["Tables"]["fields"]["Row"] & {
      recipients: {
        id: string;
        email: string;
        color: string;
      };
    })[]
  >(fields);

  console.log(currentFields);

  const authorizedRecipient = recipients.find(
    (recipient) => recipient.signer_id === userId
  );

  const userFields = fields.filter(
    (field) => field.recipient_id === authorizedRecipient?.id
  );

  const { selectedRecipient } = useSelectedRecipientStore();

  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);

  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
  });

  const fieldBounds = useRef({
    height: 0,
    width: 0,
  });

  // Add this new state to track PDF readiness
  const [isPdfReady, setIsPdfReady] = useState(false);

  const [documentParagraphs, setDocumentParagraphs] = useState<
    Database["public"]["Tables"]["documents_lines"]["Row"][]
  >([]);

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

    const channel = client
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

    // Subscribe to paragraph changes
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
          } else if (payload.eventType === "DELETE") {
            const oldParagraph =
              payload.old as Database["public"]["Tables"]["documents_lines"]["Row"];
            setDocumentParagraphs((prev) =>
              prev.filter((paragraph) => paragraph.id !== oldParagraph.id)
            );
          }
        }
      )
      .subscribe();

    // Initial fetch of paragraphs
    const fetchParagraphs = async () => {
      const { data: paragraphs, error } = await client
        .from("documents_lines")
        .select("*")
        .eq("document_id", documentId);
      if (error) {
        console.error("Error fetching paragraphs:", error);
        return;
      }
      if (paragraphs) {
        setDocumentParagraphs(paragraphs);
      }
    };
    fetchParagraphs();

    return () => {
      channel.unsubscribe();
      paragraphsChannel.unsubscribe();
    };
  }, [documentId, createClerkSupabaseClient]);

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

  // Sort fields by page, vertical position, and horizontal position
  const sortedFields = [...userFields].sort((a, b) => {
    // First sort by page
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    // Then by vertical position (lower values first since 0 is top of page)
    if (Math.abs(a.position_y - b.position_y) > 0.1) {
      // Add small threshold for floating point comparison
      return a.position_y - b.position_y;
    }
    // Finally by horizontal position (left to right)
    return a.position_x - b.position_x;
  });

  const handleFieldClick = useCallback(
    (fieldId: number) => {
      setSelectedFieldId(fieldId === selectedFieldId ? null : fieldId);
    },
    [selectedFieldId]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any field
      if (!target.closest("[data-field-id]")) {
        setSelectedFieldId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {recipients.some((recipient) => recipient.signer_id === userId) && (
          <div className="flex flex-col">
            <p className="text-lg font-medium mb-2">Document Fields</p>
            <Form {...form}>
              <form className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  {sortedFields.map((field, index) => {
                    if (
                      field.type === "name" ||
                      field.type === "text" ||
                      field.type === "email" ||
                      field.type === "initials" ||
                      field.type !== "signature"
                    ) {
                      return (
                        <div
                          key={field.id}
                          className="flex flex-col gap-2 w-full"
                        >
                          <div className="flex flex-col gap-2 bg-white rounded-xl border p-4 overflow-hidden w-full">
                            <div className="flex gap-2 text-sm items-center">
                              <div className="bg-black aspect-square rounded-full text-white size-6 flex items-center justify-center">
                                {index + 1}
                              </div>
                              {FRIENDLY_FIELD_TYPE[field.type as FieldType]}
                            </div>
                            <Input
                              placeholder={
                                FRIENDLY_FIELD_TYPE[field.type as FieldType]
                              }
                              className="bg-[#fafafa]"
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={field.id}
                        className="flex flex-col gap-2 text-sm bg-white rounded-xl border p-4 overflow-hidden w-full"
                      >
                        <div className="flex gap-2 text-sm items-center">
                          <div className="bg-black aspect-square rounded-full text-white size-6 flex items-center justify-center">
                            {index + 1}
                          </div>
                          {FRIENDLY_FIELD_TYPE[field.type as FieldType]}
                        </div>
                        <Input
                          className="h-32 bg-[#fafafa] flex items-center justify-center w-full"
                          placeholder={
                            FRIENDLY_FIELD_TYPE[field.type as FieldType]
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <Button type="submit">Finish</Button>
              </form>
            </Form>
          </div>
        )}
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
          {sortedFields.map((field, index) => (
            <FieldItem
              key={index}
              field={field}
              isSelected={field.id === selectedFieldId}
              onFieldClick={handleFieldClick}
            />
          ))}
          {documentParagraphs.map((paragraph) => (
            <ViewerParagraphItem
              key={paragraph.id}
              paragraph={paragraph}
              minHeight={MIN_HEIGHT_PX}
              minWidth={MIN_WIDTH_PX}
              defaultHeight={DEFAULT_HEIGHT_PX}
              defaultWidth={DEFAULT_WIDTH_PX}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default Elements;
