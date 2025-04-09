import React from "react";
import { useDrag } from "react-dnd";

const SignatureElement: React.FC = () => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "signature",
    item: { type: "signature" },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      className={`cursor-move p-4 border rounded ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      Signature Element
    </div>
  );
};

export default SignatureElement;
