// Define common types used across the application

// Document section type
export interface DocumentSection {
  id: string;
  title?: string;
  text: string;
  pageNumber: number;
  position: { x: number, y: number, width: number, height: number };
}

// Revision type for tracking changes
export interface SectionRevision {
  sectionId: string;
  originalText: string;
  proposedText: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  createdBy: string;
  aiGenerated: boolean;
  comment?: string;
}

// For the editable document viewer
export interface EditableSection extends DocumentSection {
  isEditing?: boolean;
  proposedText?: string;
}

// EditableDocumentViewer ref type
export interface EditableDocumentViewerRef {
  proposeEditFromAI: (sectionId: string, newText: string) => void;
  highlightSection: (sectionId: string | null) => void;
  getSections: () => EditableSection[];
} 