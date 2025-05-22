"use client";

import {
  Form,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "../ui/form";
import {
  Credenza,
  CredenzaBody,
  CredenzaTitle,
  CredenzaClose,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaContent,
  CredenzaDescription,
} from "../ui/credenza";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormField } from "../ui/form";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { SendIcon, Loader2Icon, TriangleAlert } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";

const formSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(10),
});

const SendModal = ({
  documentName,
  documentId,
  userInfo,
}: {
  documentName: string;
  documentId: string;
  userInfo: Doc<"users">;
}) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    noRecipients?: boolean;
    noSignature?: string[];
  }>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: `${userInfo.first_name} ${userInfo.last_name} via TrustInk`,
      message: `${userInfo.first_name} ${userInfo.last_name} invited you to sign ${documentName}`,
    },
  });

  // Fetch recipients with fields using Convex
  const recipientsWithFields = useQuery(
    api.recipients.getRecipientsWithFields,
    documentId ? { document_id: documentId as Id<"documents"> } : "skip"
  );

  useEffect(() => {
    if (!isOpen) return;
    if (recipientsWithFields === undefined) return; // still loading

    const errors: { noRecipients?: boolean; noSignature?: string[] } = {};

    if (!recipientsWithFields.length) {
      errors.noRecipients = true;
      setValidationErrors(errors);
      return;
    }

    // Check for recipients with no signature field
    const recipientsWithNoSignature = recipientsWithFields.filter(
      (recipient: Doc<"recipients"> & { fields: Doc<"fields">[] }) =>
        !recipient.fields?.some(
          (field: Doc<"fields">) => field.type === "signature"
        )
    );

    if (recipientsWithNoSignature.length > 0) {
      errors.noSignature = recipientsWithNoSignature
        .map((r) => (r.user_id ? String(r.user_id) : null))
        .filter((id): id is string => Boolean(id));
    }

    setValidationErrors(errors);
  }, [isOpen, recipientsWithFields]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/documents/${documentId}/send`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send document");
      }

      toast.success("Document sent successfully");
      router.push("/documents");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send document");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="default" type="button" onClick={() => setIsOpen(true)}>
        <SendIcon />
        Send
      </Button>
      <Credenza open={isOpen} onOpenChange={setIsOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Send</CredenzaTitle>
            <CredenzaDescription>
              Customize the email and send it to the recipients.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            {validationErrors.noRecipients || validationErrors.noSignature ? (
              <div className="p-4 text-sm rounded-md space-y-2 flex flex-col items-center justify-center">
                <TriangleAlert
                  className="w-28 h-28 text-red-600"
                  strokeWidth={1}
                />
                {validationErrors.noRecipients && (
                  <p>
                    <span className="font-semibold">Error:</span> You need to
                    add at least one signer to the document.
                  </p>
                )}
                {validationErrors.noSignature && (
                  <p>
                    <span className="font-semibold">Error:</span> Each recipient
                    must have at least one signature field.
                  </p>
                )}
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                  id="send-document-form"
                >
                  <FormField
                    control={form.control}
                    name="subject"
                    disabled={isLoading}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="resize-none"
                            placeholder="Your message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}
          </CredenzaBody>
          <CredenzaFooter className="flex justify-end gap-2">
            {!validationErrors.noRecipients &&
              !validationErrors.noSignature && (
                <Button
                  type="submit"
                  form="send-document-form"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <SendIcon />
                      Send
                    </div>
                  )}
                </Button>
              )}
            <CredenzaClose asChild>
              <Button variant="outline">Close</Button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
};

export default SendModal;
