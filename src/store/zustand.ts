import { create } from "zustand";
import { DocumentSection, RiskAnnotation, RiskLevel, SectionRevision } from "@/types";
import { DocumentService } from "@/services/api";

interface AnalysisResult {
  summary?: string;
  risks?: Array<{id: string; description: string}>;
  opportunities?: Array<{id: string; description: string}>;
  [key: string]: unknown;
}

interface ContractStore {
  analysisrResults: AnalysisResult | undefined;
  setAnalysisResults: (results: AnalysisResult) => void;
}

const useContractStore = create<ContractStore>((set) => ({
  analysisrResults: undefined,
  setAnalysisResults: (results: AnalysisResult) => set({ analysisrResults: results }),
}));

type ModalState = {
  modals: Record<string, boolean>;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  isOpen: (key: string) => boolean;
};

const useModalStore = create<ModalState>((set, get) => ({
  modals: {},
  openModal: (key: string) =>
    set((state: ModalState) => ({ modals: { ...state.modals, [key]: true } })),
  closeModal: (key: string) =>
    set((state: ModalState) => ({ modals: { ...state.modals, [key]: false } })),
  isOpen: (key: string) => Boolean(get().modals[key]),
}));

// Define a proper Document type
interface Document {
  id?: string;
  name?: string;
  content?: string;
  file?: File;
  pdfBytes?: Uint8Array;
  parsedContent?: {
    sections: DocumentSection[];
  };
  contractId?: string;
  ownerId?: string;
}

// Document state interface
interface DocumentState {
  currentDocument: Document | null;
  // Track revisions in the store
  revisions: SectionRevision[];
  pendingRevisions: SectionRevision[];
  activeRevisionSession: string | null;
  highlightedSection: string | null;
  isDocumentLoading: boolean;
  // Risk annotations
  riskAnnotations: RiskAnnotation[];
  isLoadingRisks: boolean;
  viewType: 'split' | 'unified';
  
  // Actions
  setCurrentDocument: (document: Document | null) => void;
  setHighlightedSection: (sectionId: string | null) => void;
  setDocumentLoading: (loading: boolean) => void;
  updateDocumentSection: (sectionId: string, newText: string, saveRevision?: boolean) => void;
  proposeRevision: (sectionId: string, newText: string, aiGenerated?: boolean, comment?: string, riskLevel?: RiskLevel) => void;
  acceptRevision: (revisionId: string) => void;
  rejectRevision: (revisionId: string) => void;
  startRevisionSession: (sessionId: string) => void;
  endRevisionSession: () => void;
  clearDocument: () => void;
  // Risk analysis
  fetchRiskAnnotations: (documentId: string) => Promise<void>;
  setViewType: (type: 'split' | 'unified') => void;
  // API integrations 
  suggestEdit: (sectionId: string) => Promise<void>;
}

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetState<T> = () => T;

const useDocumentStore = create<DocumentState>((set: SetState<DocumentState>, get: GetState<DocumentState>) => ({
  currentDocument: null,
  revisions: [],
  pendingRevisions: [],
  activeRevisionSession: null,
  highlightedSection: null,
  isDocumentLoading: false,
  riskAnnotations: [],
  isLoadingRisks: false,
  viewType: 'split',
  
  setCurrentDocument: (document: Document | null) => {
    console.log('[DocumentStore] Setting current document:', document?.name || 'null');
    set({ currentDocument: document });
  },
  
  setHighlightedSection: (sectionId: string | null) => {
    console.log('[DocumentStore] Highlighting section:', sectionId);
    set({ highlightedSection: sectionId });
  },
  
  setDocumentLoading: (loading: boolean) => {
    console.log('[DocumentStore] Set document loading:', loading);
    set({ isDocumentLoading: loading });
  },
  
  setViewType: (type: 'split' | 'unified') => {
    set({ viewType: type });
  },
  
  updateDocumentSection: (sectionId: string, newText: string, saveRevision = false) => {
    console.log('[DocumentStore] Updating section:', sectionId, 'Save as revision:', saveRevision);
    
    const currentDocument = get().currentDocument;
    if (!currentDocument || !currentDocument.parsedContent) {
      console.log('[DocumentStore] Cannot update section: No current document or parsed content');
      return;
    }
    
    const sections = currentDocument.parsedContent.sections;
    const sectionToUpdate = sections.find((section: DocumentSection) => section.id === sectionId);
    
    if (!sectionToUpdate) {
      console.log('[DocumentStore] Cannot update section: Section not found');
      return;
    }
    
    // If we need to save this as a revision
    if (saveRevision) {
      const newRevision: SectionRevision = {
        sectionId,
        originalText: sectionToUpdate.text,
        proposedText: newText,
        status: 'accepted', // Auto-accept local changes
        createdAt: new Date(),
        createdBy: 'current-user', // This would be the actual user ID
        aiGenerated: false
      };
      
      console.log('[DocumentStore] Adding accepted revision:', newRevision);
      
      set((state: DocumentState) => ({
        revisions: [...state.revisions, newRevision]
      }));
    }
    
    // Update the section in the document
    const updatedSections = sections.map((section: DocumentSection) => 
      section.id === sectionId ? { ...section, text: newText } : section
    );
    
    console.log('[DocumentStore] Section updated successfully');
    
    set({
      currentDocument: {
        ...currentDocument,
        parsedContent: {
          ...currentDocument.parsedContent,
          sections: updatedSections
        }
      }
    });
  },
  
  proposeRevision: (sectionId: string, newText: string, aiGenerated = false, comment?: string, riskLevel?: RiskLevel) => {
    console.log('[DocumentStore] Proposing revision for section:', sectionId, 'AI generated:', aiGenerated);
    
    const currentDocument = get().currentDocument;
    if (!currentDocument || !currentDocument.parsedContent) {
      console.log('[DocumentStore] Cannot propose revision: No current document or parsed content');
      return;
    }
    
    const sections = currentDocument.parsedContent.sections;
    const sectionToRevise = sections.find((section: DocumentSection) => section.id === sectionId);
    
    if (!sectionToRevise) {
      console.log('[DocumentStore] Cannot propose revision: Section not found');
      return;
    }
    
    const newRevision: SectionRevision = {
      id: `rev-${Date.now()}`,
      documentId: currentDocument.id,
      sectionId,
      originalText: sectionToRevise.text,
      proposedText: newText,
      status: 'pending',
      createdAt: new Date(),
      createdBy: get().activeRevisionSession || 'current-user',
      aiGenerated,
      comment,
      riskLevel
    };
    
    console.log('[DocumentStore] Adding pending revision with session:', get().activeRevisionSession);
    
    set((state: DocumentState) => ({
      pendingRevisions: [...state.pendingRevisions, newRevision],
      highlightedSection: sectionId // Auto-highlight the section being revised
    }));
  },
  
  acceptRevision: (revisionId: string) => {
    console.log('[DocumentStore] Accepting revision:', revisionId);
    
    const pendingRevisions = get().pendingRevisions;
    const revisionToAccept = pendingRevisions.find((rev: SectionRevision) => rev.id === revisionId);
    
    if (!revisionToAccept) {
      console.log('[DocumentStore] Cannot accept revision: Revision not found');
      return;
    }
    
    // Update the revision status
    const updatedRevision: SectionRevision = {
      ...revisionToAccept,
      status: 'accepted'
    };
    
    console.log('[DocumentStore] Updating document with accepted revision');
    
    // Update the document section
    get().updateDocumentSection(revisionToAccept.sectionId, revisionToAccept.proposedText);
    
    // Move from pending to accepted revisions
    set((state: DocumentState) => ({
      pendingRevisions: state.pendingRevisions.filter((rev: SectionRevision) => rev.id !== revisionId),
      revisions: [...state.revisions, updatedRevision]
    }));
  },
  
  rejectRevision: (revisionId: string) => {
    console.log('[DocumentStore] Rejecting revision:', revisionId);
    
    const pendingRevisions = get().pendingRevisions;
    const revisionToReject = pendingRevisions.find((rev: SectionRevision) => rev.id === revisionId);
    
    if (!revisionToReject) {
      console.log('[DocumentStore] Cannot reject revision: Revision not found');
      return;
    }
    
    // Update the revision status
    const updatedRevision: SectionRevision = {
      ...revisionToReject,
      status: 'rejected'
    };
    
    // Move from pending to rejected revisions
    set((state: DocumentState) => ({
      pendingRevisions: state.pendingRevisions.filter((rev: SectionRevision) => rev.id !== revisionId),
      revisions: [...state.revisions, updatedRevision]
    }));
  },
  
  startRevisionSession: (sessionId: string) => {
    console.log('[DocumentStore] Starting revision session:', sessionId);
    set({ activeRevisionSession: sessionId });
  },
  
  endRevisionSession: () => {
    console.log('[DocumentStore] Ending revision session');
    set({ activeRevisionSession: null });
  },
  
  clearDocument: () => {
    console.log('[DocumentStore] Clearing document');
    set({
      currentDocument: null,
      revisions: [],
      pendingRevisions: [],
      activeRevisionSession: null,
      highlightedSection: null,
      riskAnnotations: []
    });
  },
  
  fetchRiskAnnotations: async (documentId: string) => {
    console.log('[DocumentStore] Fetching risk annotations for document:', documentId);
    set({ isLoadingRisks: true });
    
    try {
      const annotations = await DocumentService.getRiskAnnotations(documentId);
      console.log('[DocumentStore] Fetched risk annotations:', annotations.length);
      set({ riskAnnotations: annotations });
    } catch (error) {
      console.error('[DocumentStore] Error fetching risk annotations:', error);
    } finally {
      set({ isLoadingRisks: false });
    }
  },
  
  suggestEdit: async (sectionId: string) => {
    console.log('[DocumentStore] Requesting AI suggested edit for section:', sectionId);
    const currentDocument = get().currentDocument;
    
    if (!currentDocument || !currentDocument.id) {
      console.error('[DocumentStore] Cannot suggest edit: No current document');
      return;
    }
    
    try {
      const suggestion = await DocumentService.suggestEdit(currentDocument.id, sectionId);
      
      if (suggestion.proposedText !== suggestion.originalText) {
        get().proposeRevision(
          sectionId,
          suggestion.proposedText,
          true, // AI generated
          suggestion.explanation
        );
        console.log('[DocumentStore] Added AI suggestion as revision');
      } else {
        console.log('[DocumentStore] No changes suggested by AI');
      }
    } catch (error) {
      console.error('[DocumentStore] Error getting AI suggestion:', error);
    }
  }
}));

// Export stores
export { useContractStore, useModalStore, useDocumentStore };
