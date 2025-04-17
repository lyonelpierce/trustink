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
import {
  SendIcon,
  LockIcon,
  Loader2Icon,
  LockOpenIcon,
  TriangleAlert,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { FormField } from "../ui/form";
import { useForm } from "react-hook-form";
import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RadioGroup } from "../ui/radio-group";
import { RadioGroupItem } from "../ui/radio-group";
import { createClient } from "@supabase/supabase-js";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  title: z.string().min(1),
  access: z.enum(["public", "private"]),
});

const SendModal = ({
  documentName,
  documentId,
}: {
  documentName: string;
  documentId: string;
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
      title: documentName || "",
      access: "public",
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

  useEffect(() => {
    if (!isOpen) return;

    const documentStatus = async () => {
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
    };

    documentStatus();
  }, [session, documentId, supabase, isOpen]);

  // Add this useEffect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && (e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!validationErrors && !isLoading) {
          form.handleSubmit(onSubmit)();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, validationErrors, isLoading, form]);

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
        Review and Send
      </Button>
      <Credenza open={isOpen} onOpenChange={setIsOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Review and Send</CredenzaTitle>
            <CredenzaDescription>
              Review the document and send it to the recipients.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            {validationErrors ? (
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
                    name="title"
                    disabled={isLoading}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="access"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Access</FormLabel>
                        <FormControl>
                          <RadioGroup
                            defaultValue="card"
                            className="grid grid-cols-2 gap-4"
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <div>
                              <RadioGroupItem
                                value="public"
                                id="public"
                                className="peer sr-only"
                                aria-label="Public"
                                disabled={isLoading}
                              />
                              <Label
                                htmlFor="public"
                                className="cursor-pointer flex gap-4 items-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <LockOpenIcon className="flex-shrink-0" />
                                <div className="flex flex-col gap-1">
                                  <span>Public</span>
                                  <span className="text-xs text-muted-foreground">
                                    Document can be viewed by anyone with the
                                    link.
                                  </span>
                                </div>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem
                                value="private"
                                id="private"
                                className="peer sr-only"
                                aria-label="Private"
                                disabled={isLoading}
                              />
                              <Label
                                htmlFor="private"
                                className="cursor-pointer flex gap-4 items-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <LockIcon className="flex-shrink-0" />
                                <div className="flex flex-col gap-1">
                                  <span>Private</span>
                                  <span className="text-xs text-muted-foreground">
                                    Users will need to sign up to view the
                                    document
                                  </span>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
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
            {!validationErrors && (
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
