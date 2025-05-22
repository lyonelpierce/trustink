"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { SignOutButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { LogOutIcon, User2Icon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const UserDropdown = () => {
  const { user } = useUser();
  const clerkId = user?.id;
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  if (!convexUser) {
    return (
      <Button
        variant="ghost"
        disabled
        className="rounded-full w-8 h-8 animate-pulse bg-muted"
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full">
        <Avatar className="w-8 h-8 rounded-full">
          <AvatarImage
            src={convexUser.image_url}
            className="rounded-full size-8"
          />
          <AvatarFallback>{convexUser.first_name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="bottom" align="end">
        <DropdownMenuLabel className="flex items-center h-full gap-0">
          <Avatar className="w-12 h-12 rounded-full flex items-center">
            <AvatarImage
              src={convexUser.image_url}
              className="rounded-full size-10"
            />
            <AvatarFallback>{convexUser.first_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">
              {convexUser.first_name} {convexUser.last_name}
            </p>
            <p className="text-xs text-gray-500">{convexUser.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-0 cursor-pointer text-xs h-10">
          <Link
            href={`${process.env.NEXT_PUBLIC_SUBDOMAIN_URL}/profile`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-start flex items-center gap-2"
            )}
          >
            <User2Icon className="w-4 h-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="px-0 cursor-pointer text-xs h-10">
          <SignOutButton redirectUrl="https://trustink.ai">
            <Button
              variant="ghost"
              className="flex items-center justify-start w-full font-medium"
            >
              <LogOutIcon className="w-4 h-4" />
              Sign Out
            </Button>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
