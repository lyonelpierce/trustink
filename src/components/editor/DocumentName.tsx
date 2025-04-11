"use client";

const DocumentName = ({ documentName }: { documentName: string }) => {
  return (
    <div>
      <p className="text-lg font-medium">{documentName}</p>
    </div>
  );
};

export default DocumentName;
