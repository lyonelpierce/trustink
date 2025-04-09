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
  // New fields for diff view
  id?: string;
  documentId?: string;
  riskLevel?: RiskLevel;
  riskCategory?: RiskCategory;
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

// Risk levels for document analysis
export type RiskLevel = 'low' | 'medium' | 'high';

// Risk categories for better organization
export type RiskCategory = 'legal' | 'financial' | 'clarity' | 'restrictive' | 'other';

// Risk annotation for highlighting risky sections
export interface RiskAnnotation {
  id: string;
  sectionId: string;
  lineNumber: number;
  riskLevel: RiskLevel;
  riskCategory: RiskCategory;
  explanation: string;
  suggestedChange?: string;
}

// Assistant response type
export interface AssistantResponse {
  text: string;
  highlightSectionId?: string;
  suggestedRevision?: {
    sectionId: string;
    proposedText: string;
  };
} 