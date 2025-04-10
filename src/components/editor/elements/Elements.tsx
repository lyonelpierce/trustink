"use client";

import {
  FRIENDLY_FIELD_TYPE,
  TAddFieldsFormSchema,
} from "@/constants/FieldTypes";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Database } from "../../../../database.types";
import { useFieldArray, useForm } from "react-hook-form";
import { PDF_VIEWER_PAGE_SELECTOR } from "@/constants/Viewer";
import { useDocumentElement } from "@/hooks/useDocumentElement";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBoundingClientRect } from "@/hooks/get-bounding-client-rect";

type FieldType = Database["public"]["Enums"]["field_type"];

const Elements = ({
  fields,
}: {
  fields: Database["public"]["Tables"]["fields"]["Row"][];
}) => {
  const { getPage, isWithinPageBounds } = useDocumentElement();

  const { control } = useForm<TAddFieldsFormSchema>({
    defaultValues: {
      fields:
        fields?.map((field) => ({
          formId: `${field.id}`,
          nativeId: field.id,
          type: field.type as
            | "signature"
            | "email"
            | "name"
            | "date"
            | "text"
            | "number"
            | "initials"
            | "radio"
            | "checkbox"
            | "dropdown",
          signerEmail: "",
          pageNumber: field.page,
          pageX: field.positionX,
          pageY: field.positionY,
          pageWidth: field.width,
          pageHeight: field.height,
        })) || [],
    },
  });

  const { append } = useFieldArray({
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
    height: 0,
    width: 0,
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
    (event: MouseEvent) => {
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

      append({
        formId: nanoid(12),
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
    },
    [append, isWithinPageBounds, selectedField, getPage]
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
    <>
      <div>
        {selectedField && (
          <Card
            className={cn(
              "bg-field-card/80 pointer-events-none fixed z-50 cursor-pointer border-2 backdrop-blur-[1px]",
              {
                "border-field-card-border": isFieldWithinBounds,
                "opacity-50 -rotate-12": !isFieldWithinBounds,
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
                "text-field-card-foreground flex w-20 font-medium h-6 text-xs rounded-3xl items-center justify-center p-2 transition-all duration-300",
                {
                  "border border-red-500": !isFieldWithinBounds,
                  "border border-green-500 scale-115": isFieldWithinBounds,
                }
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
            <Card className="group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50">
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
                <p
                  className={cn(
                    "text-muted-foreground group-data-[selected]:text-foreground w-full truncate text-3xl font-medium font-tangerine"
                  )}
                >
                  {"Signature"}
                </p>

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
            <Card className="group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50">
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
                <p
                  className={cn(
                    "text-muted-foreground group-data-[selected]:text-foreground text-xl font-medium"
                  )}
                >
                  {"Email"}
                </p>

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
            <Card className="group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50">
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
                <p
                  className={cn(
                    "text-muted-foreground group-data-[selected]:text-foreground text-xl font-medium"
                  )}
                >
                  {"Name"}
                </p>

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
            <Card className="group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50">
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
                <p
                  className={cn(
                    "text-muted-foreground group-data-[selected]:text-foreground text-xl font-medium"
                  )}
                >
                  {"Date"}
                </p>

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
            <Card className="group-data-[selected]:border-documenso h-full w-full cursor-pointer group-disabled:opacity-50">
              <CardContent className="flex flex-col items-center justify-center px-6 py-4">
                <p
                  className={cn(
                    "text-muted-foreground group-data-[selected]:text-foreground text-xl font-medium"
                  )}
                >
                  {"Text"}
                </p>

                <p className="text-muted-foreground mt-2 text-xs">
                  Custom Text
                </p>
              </CardContent>
            </Card>
          </button>
        </fieldset>
      </div>
    </>
  );
};

export default Elements;
