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
import { SignOutButton } from "@clerk/nextjs";
import { LogOutIcon, User2Icon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const UserDropdown = () => {
  const { user } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full">
        <Avatar className="w-8 h-8 rounded-full">
          <AvatarImage src={user?.imageUrl} className="rounded-full size-8" />
          <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="bottom" align="end">
        <DropdownMenuLabel className="flex items-center h-full gap-0">
          <Avatar className="w-12 h-12 rounded-full flex items-center">
            <AvatarImage
              src={user?.imageUrl}
              className="rounded-full size-10"
            />
            <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-gray-500">
              {user?.emailAddresses[0].emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-0 cursor-pointer text-xs h-10">
          <Link
            href={`/profile`}
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
