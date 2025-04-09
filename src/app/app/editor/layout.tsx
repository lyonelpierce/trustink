const EditorLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-screen">
      <div className="flex flex-row">{children}</div>
    </div>
  );
};

export default EditorLayout;
