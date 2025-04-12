import { Database } from "../../database.types";

type FieldType = Database["public"]["Enums"]["field_type"][number];

export const FRIENDLY_FIELD_TYPE: Record<FieldType, string> = {
  signature: "Signature",
  email: "Email",
  name: "Name",
  date: "Date",
  text: "Text",
  number: "Number",
  initials: "Initials",
  radio: "Radio",
  checkbox: "Checkbox",
  dropdown: "Dropdown",
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
      secondary_id: z.string().min(1),
      signerEmail: z.string(),
      pageNumber: z.number().min(1),
      pageX: z.number(),
      pageY: z.number(),
      pageWidth: z.number(),
      pageHeight: z.number(),
    })
  ),
});

export type TAddFieldsFormSchema = {
  fields: {
    type: FieldType;
    formId: string;
    nativeId?: number;
    secondary_id: string;
    signerEmail: string;
    pageNumber: number;
    pageX: number;
    pageY: number;
    pageWidth: number;
    pageHeight: number;
  }[];
};
