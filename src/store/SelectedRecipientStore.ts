import { create } from "zustand";
import { Doc } from "../../convex/_generated/dataModel";

type Recipient = Doc<"recipients">;

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
