import { Metadata } from "next";
import { convex } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { SignatureIcon } from "lucide-react";
import DashbaordTitle from "@/components/dashboard/title";
import { api } from "../../../../../../convex/_generated/api";
import SignaturesTable from "@/components/dashboard/signatures/SignaturesTable";
import AddEditSignatureModal from "@/components/dashboard/signatures/AddEditSignatureModal";
import AddEditSignatureButton from "@/components/dashboard/signatures/AddEditSignatureButton";

export const metadata: Metadata = {
  title: "Signatures",
  description: "Add or update your signatures",
};

const getUserSignatures = async () => {
  // Clerk auth is still required for SSR token
  const { userId } = await auth();
  if (!userId) return [];
  try {
    const data = await convex.query(api.signatures.getUserSignatures, {});
    return data;
  } catch (error) {
    console.log(error);
    return [];
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
          icon={<SignatureIcon className="size-6 text-white" />}
        />
        <AddEditSignatureButton />
      </div>
      <SignaturesTable signatures={signatures ?? []} />
      <AddEditSignatureModal />
    </div>
  );
};

export default SignaturesPage;
