import Logo from "./Logo";
import {
  Sidebar,
  SidebarGroup,
  SidebarFooter,
  SidebarHeader,
  SidebarContent,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center p-4">
        <Logo isMainLogo={false} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <Button>Logout</Button>
      </SidebarFooter>
    </Sidebar>
  );
}
