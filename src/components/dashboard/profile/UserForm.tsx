"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  avatar: z
    .custom<FileList>()
    .optional()
    .refine((files) => {
      if (!files) return true;
      const file = files[0];
      if (!file) return true;

      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      return validTypes.includes(file.type);
    }, "Only .jpg, .jpeg, and .png formats are supported"),
});

const UserForm = ({
  user,
}: {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    imageUrl: string;
  };
}) => {
  const [avatarPreview, setAvatarPreview] = useState(user.imageUrl);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarPreview(imageUrl);
      form.setValue("avatar", e.target.files as FileList);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);

      if (data.avatar?.[0]) {
        formData.append("avatar", data.avatar[0]);
      }

      const response = await fetch("/api/settings/profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormItem className="w-1/2">
          <FormLabel>Avatar</FormLabel>
          <div className="flex items-center gap-2">
            <Avatar className="h-32 w-32 border">
              <AvatarImage src={avatarPreview} className="object-cover" />
              <AvatarFallback>
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <FormControl>
              <Input
                type="file"
                className="cursor-pointer"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
        <div className="flex gap-4">
          <FormItem className="w-1/2">
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input {...form.register("firstName")} placeholder="First Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem className="w-1/2">
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input {...form.register("lastName")} placeholder="Last Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input
            disabled
            className="disabled:cursor-not-allowed bg-[#ececec]"
            value={user.emailAddress}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="w-36">
            Update
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserForm;
