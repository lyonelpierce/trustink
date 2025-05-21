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
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { UserPlus2Icon, Trash2Icon } from "lucide-react";
import { Doc, Id } from "../../../convex/_generated/dataModel";
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

const RecipientsForm = ({
  documentId,
  recipients,
}: {
  documentId: string;
  recipients: Doc<"recipients">[];
}) => {
  // Convex hooks
  const addRecipient = useMutation(api.recipients.addRecipient);
  const deleteRecipient = useMutation(api.recipients.deleteRecipient);
  const allRecipients = useQuery(api.recipients.getRecipients, {
    document_id: documentId as Id<"documents">,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const { selectedRecipient, setSelectedRecipient } =
    useSelectedRecipientStore();

  // Local state for recipients (for optimistic UI)
  const [localRecipients, setLocalRecipients] =
    useState<Doc<"recipients">[]>(recipients);
  useEffect(() => {
    if (allRecipients) setLocalRecipients(allRecipients);
  }, [allRecipients]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Check if recipient limit is reached
      if (localRecipients.length >= 5) {
        toast.error("Maximum of 5 signers allowed per document");
        return;
      }

      // Check if recipient already exists
      if (localRecipients.some((r) => r.email === values.email)) {
        toast.error("This recipient has already been added");
        return;
      }

      // Get currently used colors
      const usedColors = new Set(
        localRecipients.map((recipient) => recipient.color)
      );

      // Filter out used colors and pick a random one from remaining
      const availableColors = RECIPIENT_COLORS.filter(
        (color) => !usedColors.has(color)
      );
      const randomColor =
        availableColors[Math.floor(Math.random() * availableColors.length)];

      await addRecipient({
        document_id: documentId as Id<"documents">,
        email: values.email,
        name: values.email.split("@")[0], // fallback name
        color: randomColor,
      });

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
      setLocalRecipients((prev) => prev.filter((r) => r._id !== recipientId));

      // If this recipient was selected, deselect it
      if (selectedRecipient?._id === recipientId) {
        setSelectedRecipient(null);
      }

      await deleteRecipient({ recipient_id: recipientId as Id<"recipients"> });
      toast.success("Signer deleted successfully");
    } catch (error) {
      toast.error("Failed to delete signer");
      console.log(error);
    }
  };

  const handleRecipientClick = (
    recipient: Doc<"recipients"> // Use Convex Doc type
  ) => {
    if (selectedRecipient?._id === recipient._id) {
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
                    disabled={localRecipients.length >= 5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full rounded-lg"
            disabled={localRecipients.length >= 5}
          >
            <UserPlus2Icon />
            {localRecipients.length >= 5
              ? "Maximum Signers Reached"
              : "Add Signer"}
          </Button>
        </form>
      </Form>
      <div className="flex flex-col gap-4 ">
        <div className="flex flex-col gap-0">
          <p className="text-lg font-medium dark:text-black">
            2. Select a signer
          </p>
          <p className="text-xs text-gray-500">Select a signer to add fields</p>
        </div>
        {localRecipients.length > 0 ? (
          <>
            {localRecipients.map((recipient) => (
              <div
                className={cn(
                  "flex items-center justify-between gap-2 p-4 border rounded-lg shadow-sm bg-white cursor-pointer transition-all ease-in-out",
                  selectedRecipient?._id === recipient._id && "ring-2"
                )}
                style={{
                  boxShadow:
                    selectedRecipient?._id === recipient._id
                      ? `0 0 0 2px ${recipient.color}`
                      : "none",
                }}
                key={recipient._id}
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
                    handleDelete(recipient._id);
                  }}
                  className="group"
                >
                  <Trash2Icon className="size-5 text-muted-foreground transition-all ease-in-out group-hover:text-red-500 dark:text-zinc-400  " />
                </Button>
              </div>
            ))}
          </>
        ) : (
          <div className="h-20 flex items-center justify-center text-gray-500 border border-dashed border-gray-300 bg-white rounded-lg p-4 text-center text-xs">
            Add a signer to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientsForm;
