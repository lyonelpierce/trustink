import { 
  mockDocument, 
  mockRevisions, 
  mockRiskAnnotations 
} from '@/mocks/document-mock';
import { RiskAnnotation, SectionRevision } from '@/types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock API service for document operations
 */
export const DocumentService = {
  /**
   * Get document metadata and content
   */
  getDocument: async () => {
    await delay(800);
    return mockDocument;
  },
  
  /**
   * Get document revisions
   */
  getRevisions: async (documentId: string) => {
    await delay(600);
    return mockRevisions.filter(rev => rev.documentId === documentId);
  },
  
  /**
   * Accept a revision
   */
  acceptRevision: async (revisionId: string) => {
    await delay(400);
    console.log(`Accepted revision: ${revisionId}`);
    return { success: true };
  },
  
  /**
   * Reject a revision
   */
  rejectRevision: async (revisionId: string) => {
    await delay(400);
    console.log(`Rejected revision: ${revisionId}`);
    return { success: true };
  },
  
  /**
   * Analyze document for risks
   */
  analyzeRisks: async (documentId: string) => {
    await delay(1200);
    return {
      annotations: mockRiskAnnotations.filter(annotation => 
        mockRevisions.some(rev => 
          rev.documentId === documentId && rev.sectionId === annotation.sectionId
        )
      )
    };
  },
  
  /**
   * Create a new revision proposal
   */
  createRevision: async (revision: Omit<SectionRevision, 'id' | 'createdAt'>) => {
    await delay(500);
    const newRevision: SectionRevision = {
      ...revision,
      id: `rev-${Date.now()}`,
      createdAt: new Date(),
    };
    console.log('Created revision:', newRevision);
    return newRevision;
  },
  
  /**
   * Get risk annotations for a document
   */
  getRiskAnnotations: async (documentId: string): Promise<RiskAnnotation[]> => {
    await delay(800);
    return mockRiskAnnotations.filter(annotation => 
      mockRevisions.some(rev => 
        rev.documentId === documentId && rev.sectionId === annotation.sectionId
      )
    );
  },
  
  /**
   * Process a query about the document
   */
  askQuestion: async (documentId: string, question: string) => {
    await delay(1500);
    
    // Basic mock responses
    if (question.toLowerCase().includes('risk')) {
      return {
        text: "I've identified several risks in this contract. The most significant is in the Term and Termination section, where the termination clause is one-sided. This gives Company A an unfair advantage and may not be enforceable in some jurisdictions.",
        highlightSectionId: 'section-2'
      };
    }
    
    if (question.toLowerCase().includes('payment')) {
      return {
        text: "The payment terms require payment within 15 days of invoice, which is quite short compared to industry standards (usually 30-45 days). Also, the late payment interest of 1.5% per month (18% annually) could be considered high in some jurisdictions.",
        highlightSectionId: 'section-3'
      };
    }
    
    return {
      text: "I've analyzed this contract and can answer questions about its terms, potential risks, and suggested improvements. What specific aspect would you like to know about?",
      highlightSectionId: null
    };
  },
  
  /**
   * Get AI-suggested edits for a section
   */
  suggestEdit: async (documentId: string, sectionId: string) => {
    await delay(1000);
    
    const section = mockDocument.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }
    
    // Find an existing revision for this section
    const existingRevision = mockRevisions.find(
      rev => rev.documentId === documentId && rev.sectionId === sectionId
    );
    
    if (existingRevision) {
      return {
        originalText: existingRevision.originalText,
        proposedText: existingRevision.proposedText,
        explanation: existingRevision.comment
      };
    }
    
    // Custom suggestions based on section
    if (sectionId === 'section-2') {
      return {
        originalText: section.text,
        proposedText: 'This Agreement shall commence on the Effective Date and shall remain in effect for a period of one (1) year, unless earlier terminated as provided herein. Either party may terminate this Agreement at any time with thirty (30) days written notice.',
        explanation: 'Modified termination clause to be mutual rather than one-sided'
      };
    }
    
    if (sectionId === 'section-3') {
      return {
        originalText: section.text,
        proposedText: 'Payment for all services shall be due within thirty (30) days of invoice date. Late payments shall accrue interest at a rate of 1% per month or the maximum rate permitted by law, whichever is less.',
        explanation: 'Extended payment terms and reduced interest rate to industry standards'
      };
    }
    
    return {
      originalText: section.text,
      proposedText: section.text,
      explanation: 'No suggested edits for this section'
    };
  }
}; 