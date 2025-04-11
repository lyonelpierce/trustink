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
      formId: z.string().min(1), // matches secondary_id
      nativeId: z.number().optional(), // matches id
      type: z.enum(FIELD_TYPES), // matches type
      signerEmail: z.string(), // Not required since it can be empty
      pageNumber: z.number().min(1), // matches page
      pageX: z.number(), // matches position_x
      pageY: z.number(), // matches position_y
      pageWidth: z.number(), // matches width
      pageHeight: z.number(), // matches height
    })
  ),
});

export type TAddFieldsFormSchema = z.infer<typeof ZAddFieldsFormSchema>;
