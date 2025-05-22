import { convex } from "@/lib/convex";
import { UserIcon } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import DashbaordTitle from "@/components/dashboard/title";
import { api } from "../../../../../../convex/_generated/api";
import UserForm from "@/components/dashboard/profile/UserForm";

const UserPage = async () => {
  const { userId } = await auth();

  // Fetch user from Convex by Clerk ID
  const user = await convex.query(api.users.getUserByClerkId, {
    clerkId: userId!,
  });

  if (!user) {
    // Optionally handle user not found (could redirect or show error)
    return <div>User not found</div>;
  }

  // Map Convex user fields to UserForm props
  const userData = {
    id: user.user_id,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    emailAddress: user.email ?? "",
    imageUrl: user.image_url ?? "",
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
