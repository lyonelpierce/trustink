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
import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useCallback } from "react";
import { SendIcon, Loader2Icon, TriangleAlert } from "lucide-react";

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
  userInfo: {
    first_name: string;
    last_name: string;
  };
}) => {
  const router = useRouter();
  const { session } = useSession();

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

  const createClerkSupabaseClient = () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }
    );
  };

  const supabase = createClerkSupabaseClient();

  const documentStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from("recipients")
      .select(
        `
        id, 
        signer_id, 
        user_id,
        fields!fields_recipient_id_fkey (
          id,
          type,
          page,
          position_x,
          position_y,
          width,
          height
        )
      `
      )
      .eq("document_id", documentId);

    if (error) {
      console.log("error");
      console.error(error);
      return;
    }

    const errors: {
      noRecipients?: boolean;
      noSignature?: string[];
    } = {};

    if (!data?.length) {
      errors.noRecipients = true;
      setValidationErrors(errors);
      return;
    }

    // Check for recipients with no signature field
    const recipientsWithNoSignature = data.filter(
      (recipient) =>
        !recipient.fields?.some((field) => field.type === "signature")
    );

    if (recipientsWithNoSignature.length > 0) {
      errors.noSignature = recipientsWithNoSignature.map((r) => r.user_id);
    }

    setValidationErrors(errors);
  }, [supabase, documentId]);

  useEffect(() => {
    if (isOpen) {
      documentStatus();
    }
  }, [isOpen, documentStatus]); // Only run when modal is opened

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
              Review the document and send it to the recipients.
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
                    add at least one recipient to the document.
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
