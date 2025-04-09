import { RiskAnnotation, SectionRevision } from "@/types";

/**
 * Mock document data for testing
 */
export const mockDocument = {
  id: 'doc-123',
  name: 'Sample Contract.pdf',
  sections: [
    {
      id: 'section-1',
      title: 'Introduction',
      text: 'This Agreement is made and entered into as of the date of last signature below (the "Effective Date") by and between Company A, with offices at 123 Main St, and Company B, with offices at 456 Oak Ave.',
      pageNumber: 1,
      position: { x: 0, y: 0, width: 612, height: 200 }
    },
    {
      id: 'section-2',
      title: 'Term and Termination',
      text: 'This Agreement shall commence on the Effective Date and shall remain in effect for a period of one (1) year, unless earlier terminated as provided herein. Company A may terminate this Agreement at any time with thirty (30) days written notice.',
      pageNumber: 1,
      position: { x: 0, y: 200, width: 612, height: 150 }
    },
    {
      id: 'section-3',
      title: 'Payment Terms',
      text: 'Payment for all services shall be due within fifteen (15) days of invoice date. Late payments shall accrue interest at a rate of 1.5% per month or the maximum rate permitted by law, whichever is less.',
      pageNumber: 2,
      position: { x: 0, y: 0, width: 612, height: 120 }
    }
  ]
};

/**
 * Mock revision data for testing
 */
export const mockRevisions: SectionRevision[] = [
  {
    id: 'rev-1',
    documentId: 'doc-123',
    sectionId: 'section-1',
    originalText: 'This Agreement is made and entered into as of the date of last signature below (the "Effective Date") by and between Company A, with offices at 123 Main St, and Company B, with offices at 456 Oak Ave.',
    proposedText: 'This Agreement (the "Agreement") is made and entered into as of the date of last signature below (the "Effective Date") by and between Company A, a Delaware corporation, with offices at 123 Main St, and Company B, a California corporation, with offices at 456 Oak Ave.',
    comment: 'Added legal entity types and clarified definition of Agreement',
    aiGenerated: true,
    status: 'pending',
    createdAt: new Date('2023-04-05T12:30:00Z'),
    createdBy: 'ai-assistant',
    riskLevel: 'low',
    riskCategory: 'clarity'
  },
  {
    id: 'rev-2',
    documentId: 'doc-123',
    sectionId: 'section-2',
    originalText: 'This Agreement shall commence on the Effective Date and shall remain in effect for a period of one (1) year, unless earlier terminated as provided herein. Company A may terminate this Agreement at any time with thirty (30) days written notice.',
    proposedText: 'This Agreement shall commence on the Effective Date and shall remain in effect for a period of one (1) year, unless earlier terminated as provided herein. Either party may terminate this Agreement at any time with thirty (30) days written notice.',
    comment: 'Modified termination clause to be mutual rather than one-sided',
    aiGenerated: true,
    status: 'pending',
    createdAt: new Date('2023-04-05T12:35:00Z'),
    createdBy: 'ai-assistant',
    riskLevel: 'high',
    riskCategory: 'legal'
  },
  {
    id: 'rev-3',
    documentId: 'doc-123',
    sectionId: 'section-3',
    originalText: 'Payment for all services shall be due within fifteen (15) days of invoice date. Late payments shall accrue interest at a rate of 1.5% per month or the maximum rate permitted by law, whichever is less.',
    proposedText: 'Payment for all services shall be due within thirty (30) days of invoice date. Late payments shall accrue interest at a rate of 1% per month or the maximum rate permitted by law, whichever is less.',
    comment: 'Extended payment terms to industry standard and reduced interest rate',
    aiGenerated: true,
    status: 'pending',
    createdAt: new Date('2023-04-05T12:40:00Z'),
    createdBy: 'ai-assistant',
    riskLevel: 'medium',
    riskCategory: 'financial'
  }
];

/**
 * Mock risk annotations for testing
 */
export const mockRiskAnnotations: RiskAnnotation[] = [
  {
    id: 'risk-1',
    sectionId: 'section-2',
    lineNumber: 2,
    riskLevel: 'high',
    riskCategory: 'legal',
    explanation: 'One-sided termination clause gives Company A unfair advantage and may not be enforceable in some jurisdictions.',
    suggestedChange: 'Consider revising to allow both parties equal termination rights.'
  },
  {
    id: 'risk-2',
    sectionId: 'section-3',
    lineNumber: 1,
    riskLevel: 'medium',
    riskCategory: 'financial',
    explanation: 'Payment term of 15 days is unusually short for business contracts. Industry standard is 30-45 days.',
    suggestedChange: 'Consider extending payment terms to 30 days to align with standard practices.'
  },
  {
    id: 'risk-3',
    sectionId: 'section-3',
    lineNumber: 2,
    riskLevel: 'medium',
    riskCategory: 'legal',
    explanation: 'Interest rate of 1.5% per month (18% annually) could exceed maximum interest rates allowed in some jurisdictions.',
    suggestedChange: 'Consider reducing interest rate to 1% monthly or specify that it will never exceed legally permitted rates.'
  }
]; 