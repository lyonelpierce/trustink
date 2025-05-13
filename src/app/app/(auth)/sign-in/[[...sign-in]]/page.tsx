import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn waitlistUrl={`${process.env.NEXT_PUBLIC_SUBDOMAIN_URL}/waitlist`} />
  );
}
