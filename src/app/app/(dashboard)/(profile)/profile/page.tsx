import { UserIcon } from "lucide-react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import DashbaordTitle from "@/components/dashboard/title";
import UserForm from "@/components/dashboard/profile/UserForm";

const UserPage = async () => {
  const { userId } = await auth();

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId!);

  // Extract only the needed user properties
  const userData = {
    id: user.id,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    emailAddress: user.emailAddresses[0]?.emailAddress ?? "",
    imageUrl: user.imageUrl,
  };

  return (
    <div className="flex flex-col gap-8">
      <DashbaordTitle
        title="Profile"
        description="Manage your profile information"
        icon={<UserIcon className="size-6 text-white" />}
      />
      <UserForm user={userData} />
    </div>
  );
};

export default UserPage;
