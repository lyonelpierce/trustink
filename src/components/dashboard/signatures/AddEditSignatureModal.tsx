"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaTitle,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaContent,
} from "@/components/ui/credenza";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { FormLabel, FormMessage } from "@/components/ui/form";
import { Form, FormControl, FormItem } from "@/components/ui/form";

import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import useAddEditSignatureModalStore from "@/store/AddEditSignatureModalStore";

const formSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(50, { message: "Full name must be less than 50 characters" })
    .refine((value) => value.trim().split(/\s+/).length >= 2, {
      message: "Please enter both first and last name",
    }),
});

const AddEditSignatureModal = () => {
  const router = useRouter();

  const { isOpen, setIsOpen, type, signature } =
    useAddEditSignatureModalStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: type === "edit" ? signature?.full_name || "" : "",
    },
  });

  useEffect(() => {
    if (signature && type === "edit") {
      form.reset({
        full_name: signature.full_name,
      });
    } else if (type === "add") {
      form.reset({
        full_name: "",
      });
    }
  }, [signature, form, type]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (type === "add") {
        const response = await fetch("/api/signatures", {
          method: "POST",
          body: JSON.stringify(values),
        });

        if (response.status === 200) {
          const data = await response.json();

          toast.success(data.message);

          form.reset();
          setIsOpen(false);
          router.refresh();
        } else if (response.status === 409) {
          const data = await response.json();

          toast.error(data.message);
        } else {
          toast.error("Failed to create signature");
        }
      } else if (type === "edit") {
        const response = await fetch(`/api/signatures?id=${signature?.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });

        if (response.status === 200) {
          const data = await response.json();

          toast.success(data.message);

          form.reset();
          setIsOpen(false);
          router.refresh();
        } else {
          toast.error("Failed to update signature");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>
            {type === "add" ? "Create " : "Edit "} Signature
          </CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Type here"
                          className="w-full font-tangerine h-32 text-center md:text-7xl pr-8"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs">
                By clicking {type === "add" ? "Create" : "Update"}, I agree that
                my signature and initials are my legal electronic signature,
                just like signing on paper.
              </p>
              <CredenzaFooter className="flex gap-2">
                <Button type="submit">
                  {type === "add" ? "Create" : "Update"}
                </Button>
                <CredenzaClose asChild>
                  <Button variant="link">Close</Button>
                </CredenzaClose>
              </CredenzaFooter>
            </form>
          </Form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
};

export default AddEditSignatureModal;
