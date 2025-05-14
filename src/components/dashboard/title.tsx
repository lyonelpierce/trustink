const DashboardTitle = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-black size-12 flex items-center justify-center rounded-md">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default DashboardTitle;
