export interface SectionContent {
  id: string;
  content: string;
  metadata: {
    pageNumber: number;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    type?: 'paragraph' | 'heading' | 'list' | 'table';
    level?: number; // For headings
  };
}

export interface DocumentEmbeddings {
  documentId: string;
  sections: Array<{
    id: string;
    embedding: number[];
    content: string;
    metadata: SectionContent['metadata'];
  }>;
  version: string; // For tracking embedding model versions
  createdAt: string;
  updatedAt: string;
}

export interface SearchQuery {
  query: string;
  filters?: {
    pageNumbers?: number[];
    sectionTypes?: SectionContent['metadata']['type'][];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  limit?: number;
  threshold?: number; // Similarity threshold
}

export interface SearchResult {
  sectionId: string;
  content: string;
  similarity: number;
  metadata: SectionContent['metadata'];
  highlights?: Array<{
    text: string;
    score: number;
  }>;
}

export interface ProcessingStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  details?: {
    stage?: 'extraction' | 'embedding' | 'indexing';
    currentPage?: number;
    totalPages?: number;
    processedSections?: number;
    totalSections?: number;
  };
}

export interface ErrorDetails {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  action?: string;
  retry?: boolean;
  context?: Record<string, any>;
} 