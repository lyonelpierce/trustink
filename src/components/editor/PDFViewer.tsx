import Logo from "../Logo";
import Link from "next/link";
import * as React from "react";
import { XIcon } from "lucide-react";
import { DndProvider } from "react-dnd";
import { Viewer } from "@react-pdf-viewer/core";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toolbarPlugin, ToolbarSlot } from "@react-pdf-viewer/toolbar";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import SignatureElement from "./elements/SignatureElement";
import PDFDropZone from "./PDFDropZone";

interface ToolbarSlotsExampleProps {
  fileUrl: string;
}

interface DroppedItem {
  type: string;
  content?: string;
}

const ToolbarSlotsExample: React.FC<ToolbarSlotsExampleProps> = ({
  fileUrl,
}) => {
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;

  const handleDrop = (
    item: DroppedItem,
    position: { x: number; y: number }
  ) => {
    console.log(`Dropped ${item.type} at position:`, position);

    switch (item.type) {
      case "signature":
        // Handle signature drop
        console.log("Adding signature at:", position);
        break;
      case "text":
        // Handle text field drop
        console.log("Adding text field at:", position);
        break;
      case "date":
        // Handle date field drop
        console.log("Adding date field at:", position);
        break;
      default:
        console.warn("Unknown element type:", item.type);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="rpv-core__viewer h-full flex flex-col">
        <div className="flex items-center bg-white px-4 h-14 border-b fixed top-0 z-50 w-full">
          <Toolbar>
            {(props: ToolbarSlot) => {
              const {
                CurrentPageInput,
                GoToNextPage,
                GoToPreviousPage,
                NumberOfPages,
                ShowSearchPopover,
                Zoom,
                ZoomIn,
                ZoomOut,
              } = props;
              return (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Logo isMainLogo={false} />
                    <ShowSearchPopover />
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomOut />
                    <Zoom />
                    <ZoomIn />
                  </div>
                  <div className="flex items-center gap-2">
                    <GoToPreviousPage />
                    <CurrentPageInput />
                    <NumberOfPages />
                    <GoToNextPage />
                    <Link
                      href="/documents"
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <XIcon />
                    </Link>
                  </div>
                </div>
              );
            }}
          </Toolbar>
        </div>
        <div className="flex-1 flex overflow-hidden mt-14">
          <div className="bg-white w-96 border-r p-4">
            <SignatureElement />
          </div>
          <div className="relative flex-1">
            <PDFDropZone onDrop={handleDrop}>
              <Viewer
                fileUrl={fileUrl}
                plugins={[toolbarPluginInstance]}
                defaultScale={1.5}
              />
            </PDFDropZone>
          </div>
          <div className="bg-white w-[32rem] border-l p-4">Chat</div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ToolbarSlotsExample;
