"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FieldItem } from "./FieldElement";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../../database.types";
import { FRIENDLY_FIELD_TYPE } from "@/constants/FieldTypes";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useDocumentElement } from "@/hooks/useDocumentElement";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBoundingClientRect } from "@/hooks/get-bounding-client-rect";
import { useSelectedRecipientStore } from "@/store/SelectedRecipientStore";
import { useAuth, useSession, SignInButton, SignUpButton } from "@clerk/nextjs";

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
      user_id: string;
    };
  })[];
  documentId: string;
  isDocumentPdfLoaded: boolean;
  recipients: {
    id: string;
    email: string;
    color: string;
    user_id: string;
  }[];
}) => {
  const { userId } = useAuth();
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

  const { selectedRecipient } = useSelectedRecipientStore();

  const [selectedField, setSelectedField] = useState<FieldType | null>(null);

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

    return () => {
      channel.unsubscribe();
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-4 bg-white border rounded-md p-4">
          {!userId ? (
            <>
              <div className="flex flex-col">
                <p className="text-lg font-medium">Sign Document</p>
                <p className="text-sm text-gray-500">
                  {"You must be logged in to sign this document"}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <SignInButton forceRedirectUrl={`/sign/${documentId}`}>
                  <Button variant="outline">Log In</Button>
                </SignInButton>
                <SignUpButton forceRedirectUrl={`/sign/${documentId}`}>
                  <Button variant="default">Sign Up</Button>
                </SignUpButton>
              </div>
            </>
          ) : recipients.some((recipient) => recipient.user_id === userId) ? (
            <div className="flex flex-col">
              <p className="text-lg font-medium">Signer View</p>
              <p className="text-sm text-gray-500">
                {"You can sign this document"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="text-lg font-medium">Signer View</p>
              <p className="text-sm text-gray-500">
                {"You are not a recipient of this document"}
              </p>
            </div>
          )}
        </div>
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
        </>
      )}
    </div>
  );
};

export default Elements;
