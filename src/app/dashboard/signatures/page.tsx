import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import SignaturesTable from "@/components/dashboard/signatures/SignaturesTable";
import AddEditSignatureModal from "@/components/dashboard/signatures/AddEditSignatureModal";
import AddEditSignatureButton from "@/components/dashboard/signatures/AddEditSignatureButton";

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
    <div className="p-12 w-full">
      <div className="flex justify-between items-center w-full mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Signatures</h2>
          <p className="text-xs text-muted-foreground">
            Add or update your signatures
          </p>
        </div>
        <AddEditSignatureButton />
      </div>
      <SignaturesTable signatures={signatures ?? []} />
      <AddEditSignatureModal />
    </div>
  );
};

export default SignaturesPage;
