import { create } from "zustand";
import { Doc } from "../../convex/_generated/dataModel";
interface AddEditSignatureModalStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  type: "add" | "edit";
  setType: (type: "add" | "edit") => void;
  onClose: () => void;
  signature: Doc<"signatures"> | null;
  setSignature: (signature: Doc<"signatures"> | null) => void;
}

const useAddEditSignatureModalStore = create<AddEditSignatureModalStore>(
  (set) => ({
    isOpen: false,
    setIsOpen: (isOpen) => set({ isOpen }),
    type: "add",
    setType: (type) => set({ type }),
    onClose: () => set({ isOpen: false, type: "add" }),
    signature: null,
    setSignature: (signature) => set({ signature }),
  })
);

export default useAddEditSignatureModalStore;
