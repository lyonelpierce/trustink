"use client";

import {
  MailIcon,
  TypeIcon,
  User2Icon,
  Calendar1Icon,
  SignatureIcon,
  CaseUpperIcon,
  CircleDotIcon,
  SquareCheckIcon,
} from "lucide-react";
import {
  FRIENDLY_FIELD_TYPE,
  TAddFieldsFormSchema,
} from "@/constants/FieldTypes";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { FieldItem } from "./FieldElement";
import { useSession } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../../database.types";
import { useFieldArray, useForm } from "react-hook-form";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useDocumentElement } from "@/hooks/useDocumentElement";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBoundingClientRect } from "@/hooks/get-bounding-client-rect";

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
  signerEmail: string;
};

const Elements = ({
  fields,
  documentId,
  isDocumentPdfLoaded,
}: {
  fields: Database["public"]["Tables"]["fields"]["Row"][];
  documentId: string;
  isDocumentPdfLoaded: boolean;
}) => {
  const { session } = useSession();
  const { getPage, isWithinPageBounds, getFieldPosition } =
    useDocumentElement();

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

  function createClerkSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }
    );
  }

  const client = createClerkSupabaseClient();

  const { control } = useForm<TAddFieldsFormSchema>({
    defaultValues: {
      fields:
        fields?.map((field) => ({
          nativeId: field.id,
          formId: `${field.id}-${field.document_id}`,
          secondary_id: field.secondary_id || uuidv4(),
          pageNumber: field.page,
          type: field.type as FieldType,
          pageX: field.position_x,
          pageY: field.position_y,
          pageWidth: field.width,
          pageHeight: field.height,
          signerEmail: "",
        })) || [],
    },
  });

  const {
    append,
    update,
    remove,
    fields: localFields,
  } = useFieldArray({
    control,
    name: "fields",
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

      const field = {
        secondary_id: uuidv4(),
        formId: nanoid(12),
        type: selectedField,
        pageNumber,
        pageX,
        pageY,
        pageWidth: fieldPageWidth,
        pageHeight: fieldPageHeight,
        signerEmail: "",
      };

      append(field);

      try {
        const { data, error } = await client
          .from("fields")
          .insert({
            secondary_id: field.secondary_id,
            type: selectedField,
            user_id: session?.user.id,
            document_id: documentId,
            page: pageNumber,
            position_x: pageX,
            position_y: pageY,
            height: fieldPageHeight,
            width: fieldPageWidth,
          })
          .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("No data returned");

        setIsFieldWithinBounds(false);
        setSelectedField(null);
      } catch (error) {
        console.error("Error saving field:", error);
        // You might want to show an error toast here
      }
    },
    [
      append,
      isWithinPageBounds,
      selectedField,
      getPage,
      client,
      documentId,
      session?.user.id,
    ]
  );

  const onFieldResize = useCallback(
    async (node: HTMLElement, index: number) => {
      const field = localFields[index];

      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`
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
        update(index, {
          ...field,
          pageX,
          pageY,
          pageWidth,
          pageHeight,
        });
      } catch (error) {
        console.error("Error updating field position and size:", error);
      }
    },
    [getFieldPosition, localFields, update, client]
  );

  const onFieldMove = useCallback(
    async (node: HTMLElement, index: number) => {
      const field = localFields[index];

      const $page = window.document.querySelector<HTMLElement>(
        `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`
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
        update(index, {
          ...field,
          pageX,
          pageY,
        });
      } catch (error) {
        console.error("Error updating field position:", error);
      }
    },
    [getFieldPosition, localFields, update, client]
  );

  // Add new handler for field removal
  const handleFieldRemove = useCallback(
    async (index: number) => {
      if (isDeletingField) return; // Prevent multiple simultaneous deletions

      const field = localFields[index];

      try {
        setIsDeletingField(true);

        const { error } = await client
          .from("fields")
          .delete()
          .eq("secondary_id", field.secondary_id);

        if (error) throw error;

        remove(index);
      } catch (error) {
        console.error("Error removing field:", error);
      } finally {
        setIsDeletingField(false);
      }
    },
    [client, localFields, remove, isDeletingField]
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
    <div className="flex flex-col">
      {selectedField && (
        <div
          className={cn(
            "text-muted-foreground border-2 rounded-md dark:text-muted-background pointer-events-none fixed z-50 flex cursor-pointer flex-col items-center justify-center bg-white transition transition-discrete duration-200 [container-type:size]",
            {
              "-rotate-6 scale-90 rounded-md border-red-500 opacity-50 dark:bg-black/20":
                !isFieldWithinBounds,
              "dark:text-black/60 border-green-500": isFieldWithinBounds,
            }
          )}
          style={{
            top: coords.y,
            left: coords.x,
            height: fieldBounds.current.height,
            width: fieldBounds.current.width,
          }}
        >
          <span className="text-[clamp(0.425rem,25cqw,0.825rem)]">
            {FRIENDLY_FIELD_TYPE[selectedField as FieldType]}
          </span>
        </div>
      )}

      {isDocumentPdfLoaded && isPdfReady && (
        <div>
          {localFields.map((field, index) => (
            <FieldItem
              key={index}
              field={field}
              disabled={false}
              minHeight={MIN_HEIGHT_PX}
              minWidth={MIN_WIDTH_PX}
              defaultHeight={DEFAULT_HEIGHT_PX}
              defaultWidth={DEFAULT_WIDTH_PX}
              passive={isFieldWithinBounds && !!selectedField}
              active={selectedField === field.formId}
              onResize={(node) => onFieldResize(node, index)}
              onMove={(node) => onFieldMove(node, index)}
              onRemove={() => handleFieldRemove(index)}
            />
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-2">
        <fieldset className="grid grid-cols-2 w-full gap-4">
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
                <TypeIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Text</p>
              </CardContent>
            </Card>
          </button>

          <button
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
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
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
                <SquareCheckIcon className="w-6 h-6 text-muted-foreground" />

                <p className="text-muted-foreground mt-2 text-xs">Checkbox</p>
              </CardContent>
            </Card>
          </button>
        </fieldset>
      </div>
    </div>
  );
};

export default Elements;
