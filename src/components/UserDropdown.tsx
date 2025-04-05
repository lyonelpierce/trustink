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
import { LogOutIcon } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const UserDropdown = () => {
  const { user } = useUser();

  const handleFetchData = async () => {
    try {
      const response = await fetch("/api/test");
      const data = await response.json();

      console.log("DATA", data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

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
        <DropdownMenuItem onClick={handleFetchData}>
          Fetch Data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-0 cursor-pointer text-xs">
          <SignOutButton>
            <Button
              variant="ghost"
              className="flex items-center justify-start p-0 h-min w-full"
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
