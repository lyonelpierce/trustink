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
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { Database } from "../../../database.types";
import { useAuth, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback, useState } from "react";
import { UserPlus2Icon, CircleMinusIcon } from "lucide-react";
import { useSelectedRecipientStore } from "@/store/SelectedRecipientStore";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email(),
});

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
          console.log("Change received!", payload);
          fetchDocumentRecipients();
        }
      )
      .subscribe();

    const fetchDocumentRecipients = async () => {
      const { data, error } = await supabase
        .from("recipients")
        .select("*")
        .eq("document_id", documentId);

      if (error) {
        toast.error("Failed to fetch document recipients");
        console.log(error);
      }

      if (data) {
        setRecipients(data);
        console.log(data);
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
      const { data: existingRecipient } = await supabase
        .from("recipients")
        .select("*")
        .eq("document_id", documentId)
        .eq("email", values.email)
        .single();

      if (existingRecipient) {
        toast.error("This recipient has already been added");
        return;
      }

      // Check if user exists with this email
      const { data: existingUser } = await supabase
        .from("users")
        .select("clerk_id")
        .eq("email", values.email)
        .single();

      const { error } = await supabase.from("recipients").insert({
        email: values.email,
        document_id: documentId,
        user_id: userId ?? "",
        recipient_id: existingUser?.clerk_id ?? null,
        color: [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#96CEB4",
          "#FFEEAD",
          "#D4A5A5",
          "#9B59B6",
          "#3498DB",
          "#E74C3C",
          "#2ECC71",
        ][Math.floor(Math.random() * 10)],
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
      const supabase = createClerkSupabaseClient();
      const { error } = await supabase
        .from("recipients")
        .delete()
        .eq("id", recipientId);

      if (error) {
        toast.error("Failed to delete signer");
        console.log(error);
      }

      toast.success("Signer deleted successfully");
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
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="border bg-white rounded-lg p-4 flex flex-col gap-4"
        >
          <div className="flex flex-col">
            <p className="text-lg font-medium">Add Signers</p>
            <p className="text-xs text-gray-500">
              Who needs to sign the document? (Maximum 5 signers)
            </p>
          </div>

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
      {recipients.map((recipient) => (
        <div
          className={cn(
            "flex items-center justify-between gap-2 p-4 border rounded-lg shadow-sm bg-white cursor-pointer transition-all ease-in-out",
            selectedRecipient?.id === recipient.id && "ring-2 ring-black"
          )}
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
              <p className="font-medium text-sm">{recipient.email}</p>
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
            <CircleMinusIcon className="size-6 transition-all ease-in-out group-hover:text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default RecipientsForm;
