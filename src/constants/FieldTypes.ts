import { Database } from "../../database.types";

type FieldType = Database["public"]["Enums"]["field_type"][number];

export const FRIENDLY_FIELD_TYPE: Record<FieldType, string> = {
  signature: "Signature",
  email: "Email",
  name: "Name",
  date: "Date",
  text: "Text",
} as const;

import { z } from "zod";

const FIELD_TYPES = [
  "signature",
  "email",
  "name",
  "date",
  "text",
  "number",
  "initials",
  "radio",
  "checkbox",
  "dropdown",
] as const;

export const ZAddFieldsFormSchema = z.object({
  fields: z.array(
    z.object({
      formId: z.string().min(1),
      nativeId: z.number().optional(),
      type: z.enum(FIELD_TYPES),
      signerEmail: z.string().min(1),
      pageNumber: z.number().min(1),
      pageX: z.number().min(0),
      pageY: z.number().min(0),
      pageWidth: z.number().min(0),
      pageHeight: z.number().min(0),
    })
  ),
});

export type TAddFieldsFormSchema = z.infer<typeof ZAddFieldsFormSchema>;
