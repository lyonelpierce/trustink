import * as React from "react";
import { Viewer } from "@react-pdf-viewer/core";
import { toolbarPlugin, ToolbarSlot } from "@react-pdf-viewer/toolbar";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import Logo from "../Logo";

interface ToolbarSlotsExampleProps {
  fileUrl: string;
}

const ToolbarSlotsExample: React.FC<ToolbarSlotsExampleProps> = ({
  fileUrl,
}) => {
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;

  return (
    <div className="rpv-core__viewer h-full flex flex-col">
      <div className="flex items-center bg-white px-2 h-14 border-b">
        <Toolbar>
          {(props: ToolbarSlot) => {
            const {
              CurrentPageInput,
              EnterFullScreen,
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
                  <EnterFullScreen />
                </div>
              </div>
            );
          }}
        </Toolbar>
      </div>
      <div className="flex-1 overflow-hidden">
        <Viewer
          fileUrl={fileUrl}
          plugins={[toolbarPluginInstance]}
          defaultScale={1.5}
        />
      </div>
    </div>
  );
};

export default ToolbarSlotsExample;
