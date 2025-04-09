const EditorLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-screen">
      <div>{children}</div>
    </div>
  );
};

export default EditorLayout;
