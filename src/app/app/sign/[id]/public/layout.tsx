import ViewerNavbar from "@/components/viewer/ViewerNavbar";

const ViewerLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <ViewerNavbar />
      {children}
    </div>
  );
};

export default ViewerLayout;
