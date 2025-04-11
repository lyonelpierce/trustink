import EditorNavbar from "@/components/editor/EditorNavbar";

const EditorLayout = async ({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) => {
  return (
    <>
      <EditorNavbar />
      {children}
    </>
  );
};

export default EditorLayout;
