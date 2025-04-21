import {
  LockIcon,
  UserIcon,
  SignatureIcon,
  CreditCardIcon,
} from "lucide-react";
import Link from "next/link";

const NavigationItems = [
  {
    label: "Profile",
    href: "/profile",
    icon: <UserIcon className="w-5 h-5" />,
  },
  {
    label: "Signatures",
    href: "/signatures",
    icon: <SignatureIcon className="w-5 h-5" />,
  },
  {
    label: "Security",
    href: "/security",
    icon: <LockIcon className="w-5 h-5" />,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: <CreditCardIcon className="w-5 h-5" />,
  },
];

const LayoutPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex gap-2">
      <div className="w-1/4 flex flex-col">
        {NavigationItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-2 hover:bg-accent p-2 rounded-lg text-sm px-4"
            >
              <div className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div className="w-3/4">{children}</div>
    </div>
  );
};

export default LayoutPage;
