"use client";

import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Credenza,
  CredenzaBody,
  CredenzaTitle,
  CredenzaClose,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaDescription,
} from "../ui/credenza";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { FormField } from "../ui/form";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { RadioGroup } from "../ui/radio-group";
import { RadioGroupItem } from "../ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, LockOpenIcon, SendIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

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

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: documentName || "",
      access: "public",
    },
  });

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
    <Credenza>
      <CredenzaTrigger asChild>
        <Button>
          <SendIcon />
          Review and Send
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Review and Send</CredenzaTitle>
          <CredenzaDescription>
            Review the document and send it to the recipients.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              id="send-document-form"
            >
              <FormField
                control={form.control}
                name="title"
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
                          />
                          <Label
                            htmlFor="public"
                            className="cursor-pointer flex gap-4 items-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <LockOpenIcon className="flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                              <span>Public</span>
                              <span className="text-xs text-muted-foreground">
                                Document can be viewed by anyone with the link.
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
                          />
                          <Label
                            htmlFor="private"
                            className="cursor-pointer flex gap-4 items-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <LockIcon className="flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                              <span>Private</span>
                              <span className="text-xs text-muted-foreground">
                                Users will need to sign up to view the document
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
        </CredenzaBody>
        <CredenzaFooter className="flex justify-end gap-2">
          <Button type="submit" form="send-document-form" disabled={isLoading}>
            {isLoading ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <SendIcon />
                Send
              </div>
            )}
          </Button>
          <CredenzaClose asChild>
            <Button variant="outline">Close</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};

export default SendModal;
