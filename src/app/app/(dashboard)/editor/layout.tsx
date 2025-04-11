import { Textarea } from "@/components/ui/textarea";
import EditorNavbar from "@/components/editor/EditorNavbar";
import Elements from "@/components/editor/elements/Elements";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
const EditorLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <EditorNavbar />
      <div className="flex">
        <div className="w-1/6 fixed left-0 top-0 border-r h-full pt-14 z-50">
          <Accordion type="single" collapsible className="border-b">
            <AccordionItem value="item-1">
              <AccordionTrigger className="cursor-pointer px-4 hover:no-underline border-b rounded-none">
                Fields
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <Elements fields={[]} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-1/6" />
          <div className="w-2/5">{children}</div>
          <div className="w-1/6" />
        </div>
        <div className="fixed right-0 border-l h-full top-0 w-1/6 p-4 pt-20 z-50">
          <Textarea />
        </div>
      </div>
    </>
  );
};

export default EditorLayout;
