import Logo from "./Logo";
import {
  Sidebar,
  SidebarMenu,
  SidebarGroup,
  SidebarFooter,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { File, Home, LogOutIcon, Signature } from "lucide-react";

const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Documents",
    url: "/dashboard/documents",
    icon: File,
  },

  {
    title: "Signatures",
    url: "/dashboard/signatures",
    icon: Signature,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row justify-between items-center p-4">
        <Logo isMainLogo={false} className="text-xl" />
        <ModeToggle rounded={false} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SignOutButton>
          <Button className="gap-1">
            <LogOutIcon />
            Logout
          </Button>
        </SignOutButton>
      </SidebarFooter>
    </Sidebar>
  );
}
