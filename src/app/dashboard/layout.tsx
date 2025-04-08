import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="w-full p-12">{children}</main>
    </SidebarProvider>
  );
};

export default DashboardLayout;
