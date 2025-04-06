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
import Signature from "./Signature";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import useAddEditSignatureModalStore from "@/store/AddEditSignatureModalStore";

const fonts = [
  {
    name: "Tangerine",
    value: "font-tangerine",
  },
  {
    name: "Waterfall",
    value: "font-waterfall",
  },
] as const;

const formSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(50, { message: "Full name must be less than 50 characters" }),
  initials: z
    .string()
    .min(1, { message: "Initials must be at least 1 character" })
    .max(50, { message: "Initials must be less than 50 characters" }),
  font: z.enum([fonts[0].value, fonts[1].value], {
    required_error: "Please select a font",
    invalid_type_error: "Please select a valid font",
  }),
});

const AddEditSignatureModal = () => {
  const router = useRouter();

  const { isOpen, setIsOpen, type, signature } =
    useAddEditSignatureModalStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: signature?.full_name || "",
      initials: signature?.initials || "",
      font:
        (signature?.font as "font-tangerine" | "font-waterfall") ||
        fonts[0].value,
    },
  });

  useEffect(() => {
    if (signature) {
      form.reset({
        full_name: signature.full_name,
        initials: signature.initials,
        font: signature.font as "font-tangerine" | "font-waterfall",
      });
    }
  }, [signature, form]);

  const name = form.watch("full_name") || "John Doe";
  const initials = form.watch("initials") || "JD";

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
                    <FormItem className="w-2/3">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Doe"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initials"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Initials</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="JD" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="font"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {fonts.map((font) => (
                          <FormItem
                            key={font.value}
                            className="flex items-center space-x-3 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={font.value}
                                className="size-6"
                              />
                            </FormControl>
                            <Signature
                              fullName={name}
                              initials={initials}
                              font={font.value}
                            />
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <p className="text-xs mt-8">
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
