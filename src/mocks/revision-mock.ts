import { SectionRevision } from '@/types';

// Add missing risk category if needed
declare module '@/types' {
  interface RiskCategoryEnum {
    'termination': 'termination';
  }
}

// Mock revision data for testing
export const mockRevisions: SectionRevision[] = [
  {
    id: 'rev-1',
    documentId: 'doc-123',
    sectionId: 'section-1',
    originalText: 'This is the original text of section 1.',
    proposedText: 'This is the proposed new text of section 1 with some important changes.',
    status: 'pending',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    createdBy: 'user-123',
    aiGenerated: false,
    comment: 'I think this clarifies the meaning better.',
    riskLevel: 'low',
    riskCategory: 'clarity'
  },
  {
    id: 'rev-2',
    documentId: 'doc-123',
    sectionId: 'section-2',
    originalText: 'The party of the second part agrees to all terms herein.',
    proposedText: 'The customer agrees to all terms described in this contract.',
    status: 'pending',
    createdAt: new Date('2023-01-02T11:30:00Z'),
    createdBy: 'ai-assistant',
    aiGenerated: true,
    comment: 'Simplified the legal language for better clarity.',
    riskLevel: 'medium',
    riskCategory: 'legal'
  },
  {
    id: 'rev-3',
    documentId: 'doc-123',
    sectionId: 'section-3',
    originalText: 'Payments must be made within 30 business days.',
    proposedText: 'Payments must be made within 15 business days of invoice date.',
    status: 'accepted',
    createdAt: new Date('2023-01-03T09:15:00Z'),
    createdBy: 'user-456',
    aiGenerated: false,
    comment: 'Shorter payment terms to improve cash flow.',
    riskLevel: 'high',
    riskCategory: 'financial'
  },
  {
    id: 'rev-4',
    documentId: 'doc-123',
    sectionId: 'section-4',
    originalText: 'The agreement may be terminated with 90 days notice.',
    proposedText: 'The agreement may be terminated with 30 days written notice.',
    status: 'rejected',
    createdAt: new Date('2023-01-04T14:45:00Z'),
    createdBy: 'user-123',
    aiGenerated: false,
    comment: 'Shorter termination period.',
    riskLevel: 'medium',
    riskCategory: 'legal'
  }
];

export default mockRevisions; 