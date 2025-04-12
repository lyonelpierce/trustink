import { create } from "zustand";
import { Database } from "../../database.types";

type Recipient = Database["public"]["Tables"]["recipients"]["Row"];

interface SelectedRecipientState {
  selectedRecipient: Recipient | null;
  setSelectedRecipient: (recipient: Recipient | null) => void;
}

export const useSelectedRecipientStore = create<SelectedRecipientState>(
  (set) => ({
    selectedRecipient: null,
    setSelectedRecipient: (recipient) => set({ selectedRecipient: recipient }),
  })
);
