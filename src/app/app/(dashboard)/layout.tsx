import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import WidthWrapper from "@/components/WidthWrapper";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect(`${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}`);
  }

  return (
    <>
      <DashboardNavbar />
      <WidthWrapper className="pt-24">{children}</WidthWrapper>
    </>
  );
};

export default DashboardLayout;
