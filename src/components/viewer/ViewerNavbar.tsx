import Logo from "@/components/Logo";
import { auth } from "@clerk/nextjs/server";

const ViewerNavbar = async () => {
  const { userId } = await auth();

  return (
    <div className="h-14 flex items-center justify-between px-4 fixed top-0 z-[50] w-full backdrop-blur-3xl border-b bg-white/40">
      <div className="flex items-center justify-start gap-2 w-1/3">
        <Logo
          isMainLogo={false}
          href={userId ? "/documents" : `${process.env.NEXT_PUBLIC_BASE_URL}`}
        />
      </div>
      <div className="w-1/3 flex justify-center items-center"></div>
      <div className="w-1/3 flex justify-end items-center"></div>
    </div>
  );
};

export default ViewerNavbar;
