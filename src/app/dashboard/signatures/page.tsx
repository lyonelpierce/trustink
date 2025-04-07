import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import SignaturesTable from "@/components/dashboard/signatures/SignaturesTable";
import AddEditSignatureModal from "@/components/dashboard/signatures/AddEditSignatureModal";
import AddEditSignatureButton from "@/components/dashboard/signatures/AddEditSignatureButton";
import DashbaordTitle from "@/components/dashboard/title";

const getUserSignatures = async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("signatures")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.log(error);
  }
};

const SignaturesPage = async () => {
  const signatures = await getUserSignatures();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center w-full mb-8">
        <DashbaordTitle
          title="Signatures"
          description="Add or update your signatures"
        />
        <AddEditSignatureButton />
      </div>
      <SignaturesTable signatures={signatures ?? []} />
      <AddEditSignatureModal />
    </div>
  );
};

export default SignaturesPage;
