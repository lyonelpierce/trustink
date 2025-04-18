"use client";

import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
  FormControl,
} from "../ui/form";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { Database } from "../../../database.types";
import { useAuth, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus2Icon, Trash2Icon } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useSelectedRecipientStore } from "@/store/SelectedRecipientStore";

const formSchema = z.object({
  email: z.string().email(),
});

const RECIPIENT_COLORS = [
  "#34C759", // Green
  "#007AFF", // Blue
  "#FF9500", // Orange
  "#AF52DE", // Purple
  "#FFD60A", // Yellow
  "#5856D6", // Indigo
  "#00BCD4", // Cyan
  "#FF2D55", // Pink
  "#64DD17", // Lime
] as const;

const RecipientsForm = ({ documentId }: { documentId: string }) => {
  const { userId } = useAuth();
  const { session } = useSession();

  const [recipients, setRecipients] = useState<
    Database["public"]["Tables"]["recipients"]["Row"][]
  >([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const { selectedRecipient, setSelectedRecipient } =
    useSelectedRecipientStore();

  const createClerkSupabaseClient = useCallback(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }
    );
  }, [session]);

  useEffect(() => {
    const supabase = createClerkSupabaseClient();

    const channel = supabase
      .channel("recipients")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipients",
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRecipients((prev) => [
              ...prev,
              payload.new as Database["public"]["Tables"]["recipients"]["Row"],
            ]);
          } else if (payload.eventType === "DELETE") {
            setRecipients((prev) =>
              prev.filter((recipient) => recipient.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Initial fetch of recipients
    const fetchDocumentRecipients = async () => {
      const { data, error } = await supabase
        .from("recipients")
        .select("*")
        .eq("document_id", documentId);

      if (error) {
        toast.error("Failed to fetch document recipients");
        console.log(error);
        return;
      }

      if (data) {
        setRecipients(data);
      }
    };

    fetchDocumentRecipients();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, createClerkSupabaseClient]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const supabase = createClerkSupabaseClient();

      // Check if recipient limit is reached
      if (recipients.length >= 5) {
        toast.error("Maximum of 5 signers allowed per document");
        return;
      }

      // Check if recipient already exists
      const { data: existingRecipients, error: existingError } = await supabase
        .from("recipients")
        .select("*")
        .eq("document_id", documentId)
        .eq("email", values.email);

      if (existingError) {
        toast.error("Failed to check existing recipients");
        console.log(existingError);
        return;
      }

      if (existingRecipients && existingRecipients.length > 0) {
        toast.error("This recipient has already been added");
        return;
      }

      // Check if user exists with this email
      const { data: existingUsers, error: existingUserError } = await supabase
        .from("users")
        .select("clerk_id")
        .eq("email", values.email);

      if (existingUserError) {
        toast.error("Failed to check existing users");
        console.log(existingUserError);
        return;
      }

      // Get currently used colors
      const usedColors = new Set(
        recipients.map((recipient) => recipient.color)
      );

      // Filter out used colors and pick a random one from remaining
      const availableColors = RECIPIENT_COLORS.filter(
        (color) => !usedColors.has(color)
      );
      const randomColor =
        availableColors[Math.floor(Math.random() * availableColors.length)];

      const { error } = await supabase.from("recipients").insert({
        email: values.email,
        document_id: documentId,
        user_id: userId ?? "",
        signer_id: existingUsers?.[0]?.clerk_id ?? null,
        color: randomColor,
      });

      if (error) {
        toast.error("Failed to add signer");
        console.log(error);
        return;
      }

      toast.success("Signer added successfully");
      form.reset();
    } catch (error) {
      toast.error("Failed to add signer");
      console.log(error);
    }
  };

  const handleDelete = async (recipientId: string) => {
    try {
      // Optimistically update UI
      setRecipients((prev) => prev.filter((r) => r.id !== recipientId));

      // If this recipient was selected, deselect it
      if (selectedRecipient?.id === recipientId) {
        setSelectedRecipient(null);
      }

      const supabase = createClerkSupabaseClient();
      const { error } = await supabase
        .from("recipients")
        .delete()
        .eq("id", recipientId);

      if (error) {
        // Revert optimistic update on error
        const supabase = createClerkSupabaseClient();
        const { data } = await supabase
          .from("recipients")
          .select("*")
          .eq("document_id", documentId);

        if (data) {
          setRecipients(data);
        }
        toast.error("Failed to delete signer");
        console.log(error);
      } else {
        toast.success("Signer deleted successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete signer");
    }
  };

  const handleRecipientClick = (
    recipient: Database["public"]["Tables"]["recipients"]["Row"]
  ) => {
    if (selectedRecipient?.id === recipient.id) {
      setSelectedRecipient(null);
    } else {
      setSelectedRecipient(recipient);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <div className="flex flex-col">
          <p className="text-lg font-medium dark:text-black">1. Add Signers</p>
          <p className="text-xs text-gray-500">
            Who needs to sign the document? (Max 5)
          </p>
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="border bg-white rounded-lg p-4 flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-0">
                  Email
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Email"
                    {...field}
                    disabled={recipients.length >= 5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full rounded-lg"
            disabled={recipients.length >= 5}
          >
            <UserPlus2Icon />
            {recipients.length >= 5 ? "Maximum Signers Reached" : "Add Signer"}
          </Button>
        </form>
      </Form>
      {recipients.length > 0 && (
        <div className="flex flex-col gap-4 ">
          <div className="flex flex-col gap-0">
            <p className="text-lg font-medium dark:text-black">
              2. Select a signer
            </p>
            <p className="text-xs text-gray-500">
              Select a signer to add fields
            </p>
          </div>
          {recipients.map((recipient) => (
            <div
              className={cn(
                "flex items-center justify-between gap-2 p-4 border rounded-lg shadow-sm bg-white cursor-pointer transition-all ease-in-out",
                selectedRecipient?.id === recipient.id && "ring-2"
              )}
              style={{
                boxShadow:
                  selectedRecipient?.id === recipient.id
                    ? `0 0 0 2px ${recipient.color}`
                    : "none",
              }}
              key={recipient.id}
              onClick={() => handleRecipientClick(recipient)}
            >
              <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10">
                  <AvatarFallback
                    className="uppercase"
                    style={{ backgroundColor: recipient.color }}
                  >
                    {recipient.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="font-medium text-sm truncate">
                    {recipient.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(recipient.id);
                }}
                className="group"
              >
                <Trash2Icon className="size-5 text-muted-foreground transition-all ease-in-out group-hover:text-red-500 dark:text-zinc-400  " />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipientsForm;
