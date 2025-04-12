import {
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { CircleMinusIcon, UserPlus2 } from "lucide-react";

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
});

const RecipientsForm = () => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4">
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-2/3">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="w-1/3">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-2">
            <FormLabel className="invisible">Del</FormLabel>
            <Button variant="ghost" size="icon">
              <CircleMinusIcon />
            </Button>
          </div>
        </div>

        <Button className="w-full" type="button">
          <UserPlus2 />
          Add Recipient
        </Button>
      </form>
    </Form>
  );
};

export default RecipientsForm;
