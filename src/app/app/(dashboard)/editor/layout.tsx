import {
  CalendarIcon,
  SignatureIcon,
  CaseUpperIcon,
  TextCursorInputIcon,
} from "lucide-react";
import EditorNavbar from "@/components/editor/EditorNavbar";
import InputElement from "@/components/editor/elements/InputElement";
import { Textarea } from "@/components/ui/textarea";

const Elements = [
  {
    id: 1,
    name: "Signature",
    icon: <SignatureIcon />,
    component: InputElement,
  },
  {
    id: 2,
    name: "Initials",
    icon: <CaseUpperIcon />,
    component: InputElement,
  },
  {
    id: 3,
    name: "Date",
    icon: <CalendarIcon />,
    component: InputElement,
  },
  {
    id: 7,
    name: "Text",
    icon: <TextCursorInputIcon />,
    component: InputElement,
  },
];

const EditorLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <EditorNavbar />
      <div className="flex">
        <div className="w-1/6 fixed left-0 top-0 border-r h-full pt-20 p-4">
          <div className="grid grid-cols-2 gap-4">
            {Elements.map((element) => (
              <div
                key={element.id}
                className="flex flex-col shadow-md w-full h-min p-4 items-center justify-center border rounded-md"
              >
                {element.icon}
                <p className="select-none text-sm">{element.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-1/6" />
          <div className="w-2/5">{children}</div>
          <div className="w-1/6" />
        </div>
        <div className="fixed right-0 border-l h-full top-0 w-1/6 p-4 pt-20">
          <Textarea />
        </div>
      </div>
    </>
  );
};

export default EditorLayout;
