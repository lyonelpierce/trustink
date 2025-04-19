"use client";

import { z } from "zod";
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
  firstName: z.string().min(1),
  lastName: z.string().min(1),
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    },
  });

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4">
        <FormItem className="w-1/2">
          <FormLabel>Avatar</FormLabel>
          <div className="flex items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <FormControl>
              <Input type="file" />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
        <div className="flex gap-4">
          <FormItem className="w-1/2">
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input placeholder="First Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem className="w-1/2">
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input placeholder="Last Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input
            disabled
            className="cursor-not-allowed"
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
