"use client";

import {
  FRIENDLY_FIELD_TYPE,
  TAddFieldsFormSchema,
} from "@/constants/FieldTypes";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Database } from "../../../../database.types";
import { useFieldArray, useForm } from "react-hook-form";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import {
  MailIcon,
  TypeIcon,
  User2Icon,
  Calendar1Icon,
  SignatureIcon,
} from "lucide-react";
import { FieldItem } from "./FieldElement";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useDocumentElement } from "@/hooks/useDocumentElement";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBoundingClientRect } from "@/hooks/get-bounding-client-rect";

type FieldType = Database["public"]["Enums"]["field_type"];

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
          formId: field.secondary_id ?? "",
          nativeId: field.id,
          type: field.type as FieldType,
          signerEmail: "",
          pageNumber: field.page,
          pageX: field.position_x,
          pageY: field.position_y,
          pageWidth: field.width,
          pageHeight: field.height,
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

  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [isFieldWithinBounds, setIsFieldWithinBounds] = useState(false);
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
  });

  const fieldBounds = useRef({
    height: 24,
    width: 80,
  });

  // Add a state to track if fields should be rendered
  const [shouldRenderFields, setShouldRenderFields] = useState(false);

  // Add useEffect to delay field rendering until PDF is loaded
  useEffect(() => {
    if (isDocumentPdfLoaded) {
      // Small delay to ensure PDF is fully rendered
      const timer = setTimeout(() => {
        setShouldRenderFields(true);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setShouldRenderFields(false);
    }
  }, [isDocumentPdfLoaded]);

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

      console.log("pageX", pageX);
      console.log("pageY", pageY);
      console.log("fieldPageWidth", fieldPageWidth);
      console.log("fieldPageHeight", fieldPageHeight);

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
          })
          .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("No data returned");

        const insertedField = data[0];

        append({
          formId: insertedField.secondary_id,
          nativeId: insertedField.id,
          type: selectedField,
          pageNumber,
          pageX,
          pageY,
          pageWidth: fieldPageWidth,
          pageHeight: fieldPageHeight,
          signerEmail: "",
        });

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
          .eq("id", field.nativeId);

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
          .eq("id", field.nativeId);

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
      const field = localFields[index];

      try {
        const { error } = await client
          .from("fields")
          .delete()
          .eq("id", field.nativeId);

        if (error) throw error;

        // Remove from local state after successful DB deletion
        remove(index);
      } catch (error) {
        console.error("Error removing field:", error);
        // You might want to show an error toast here
      }
    },
    [client, localFields, remove]
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

  return (
    <div className="flex flex-col">
      {isDocumentPdfLoaded && shouldRenderFields && (
        <div>
          {localFields.map((field, index) => (
            <FieldItem
              key={field.nativeId}
              field={field}
              minHeight={fieldBounds.current.height}
              minWidth={fieldBounds.current.width}
              passive={isFieldWithinBounds && !!selectedField}
              onResize={(node) => onFieldResize(node, index)}
              onMove={(node) => onFieldMove(node, index)}
              onRemove={() => handleFieldRemove(index)}
            />
          ))}
        </div>
      )}
      <div>
        {selectedField && (
          <Card
            className={cn(
              "bg-field-card/80 pointer-events-none fixed z-50 cursor-pointer border-2 backdrop-blur-[1px] transition-transform transition-discrete duration-300 ease-in-out",
              {
                "border-green-500": isFieldWithinBounds,
                "border-red-500 opacity-50 -rotate-12": !isFieldWithinBounds,
              }
            )}
            style={{
              top: coords.y,
              left: coords.x,
              height: fieldBounds.current.height,
              width: fieldBounds.current.width,
            }}
          >
            <CardContent
              className={cn(
                "text-field-card-foreground flex w-20 font-medium h-6 text-xs rounded-md items-center justify-center p-2 transition-all duration-300",
                selectedField === "signature" && "font-tangerine text-2xl"
              )}
            >
              {FRIENDLY_FIELD_TYPE[selectedField]}
            </CardContent>
          </Card>
        )}
      </div>
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
        </fieldset>
      </div>
    </div>
  );
};

export default Elements;
