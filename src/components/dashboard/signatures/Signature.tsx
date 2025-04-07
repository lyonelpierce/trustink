import { cn } from "@/lib/utils";

const Signature = ({
  fullName,
  initials,
  font,
  className,
}: {
  fullName: string;
  initials: string;
  font: string;
  className?: string;
}) => {
  return (
    <span className={cn(`${font} text-4xl select-none`, className)}>
      {fullName} {initials}
    </span>
  );
};

export default Signature;
