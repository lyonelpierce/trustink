import { create } from "zustand";
import { Database } from "../../database.types";

interface AddEditSignatureModalStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  type: "add" | "edit";
  setType: (type: "add" | "edit") => void;
  onClose: () => void;
  signature: Database["public"]["Tables"]["signatures"]["Row"] | null;
  setSignature: (
    signature: Database["public"]["Tables"]["signatures"]["Row"] | null
  ) => void;
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
