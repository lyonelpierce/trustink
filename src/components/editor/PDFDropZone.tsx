import React from "react";
import { useDrop } from "react-dnd";

interface DroppedItem {
  type: string;
  content?: string;
}

interface PDFDropZoneProps {
  children: React.ReactNode;
  onDrop: (item: DroppedItem, position: { x: number; y: number }) => void;
}

const PDFDropZone: React.FC<PDFDropZoneProps> = ({ children, onDrop }) => {
  const [{ isOver }, drop] = useDrop<DroppedItem, void, { isOver: boolean }>(
    () => ({
      accept: "signature",
      drop: (item: DroppedItem, monitor) => {
        const offset = monitor.getClientOffset();
        if (offset) {
          // Get the drop target's bounding rectangle
          const dropTargetRect = document
            .querySelector(".pdf-drop-zone")
            ?.getBoundingClientRect();
          if (dropTargetRect) {
            // Calculate position relative to the drop zone
            const position = {
              x: offset.x - dropTargetRect.left,
              y: offset.y - dropTargetRect.top,
            };
            onDrop(item, position);
          }
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    })
  );

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      className={`pdf-drop-zone w-full h-full ${isOver ? "bg-blue-50" : ""}`}
    >
      {children}
    </div>
  );
};

export default PDFDropZone;
