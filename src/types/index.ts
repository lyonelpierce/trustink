export interface SectionRevision {
  id: string;
  documentId: string;
  sectionId: string;
  sectionTitle?: string;
  content: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
} 