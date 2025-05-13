import { Waitlist } from "@clerk/nextjs";

export default function WaitlistPage() {
  return <Waitlist afterJoinWaitlistUrl={process.env.NEXT_PUBLIC_BASE_URL} />;
}
