"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const UserDropdown = () => {
  const { user } = useUser();

  console.log(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full">
        <Avatar className="w-8 h-8 rounded-full">
          <AvatarImage src={user?.imageUrl} className="rounded-full size-8" />
          <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" side="bottom" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <SignOutButton>
            <Button
              variant="ghost"
              className="flex items-start justify-start p-0 h-min w-full"
            >
              Sign Out
            </Button>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
