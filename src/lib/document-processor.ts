import { createClient } from '@supabase/supabase-js';
import { SectionContent, DocumentEmbeddings, ProcessingStatus, ErrorDetails } from '@/types/document';
import { TogetherAIService } from './together-ai';
import { PDFDocument } from 'pdf-lib';
import { handleError } from './error-handler';

export class DocumentProcessor {
  private supabase;
  private togetherAI;
  private status: ProcessingStatus = { status: 'idle' };
  private onStatusChange?: (status: ProcessingStatus) => void;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    togetherApiKey: string,
    onStatusChange?: (status: ProcessingStatus) => void
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.togetherAI = new TogetherAIService({
      apiKey: togetherApiKey,
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
    });
    this.onStatusChange = onStatusChange;
  }

  private updateStatus(update: Partial<ProcessingStatus>) {
    this.status = { ...this.status, ...update };
    this.onStatusChange?.(this.status);
  }

  private async extractSections(pdfData: ArrayBuffer): Promise<SectionContent[]> {
    try {
      this.updateStatus({
        status: 'processing',
        message: 'Extracting document sections...',
        details: {
          stage: 'extraction'
        }
      });

      // TODO: Implement actual PDF extraction
      // For now, return mock sections
      const mockSections: SectionContent[] = [
        {
          id: 'section-1',
          content: 'Mock section 1 content',
          metadata: {
            pageNumber: 1,
            position: { x: 0, y: 0, width: 100, height: 100 },
            type: 'heading',
            level: 1
          }
        }
      ];

      return mockSections;
    } catch (error) {
      const errorDetails: ErrorDetails = {
        code: 'EXTRACTION_FAILED',
        message: 'Failed to extract sections from document',
        severity: 'high',
        retry: true,
        context: { error }
      };

      this.updateStatus({
        status: 'error',
        error: errorDetails.message,
        details: {
          stage: 'extraction'
        }
      });

      throw errorDetails;
    }
  }

  private async generateEmbeddings(sections: SectionContent[]): Promise<DocumentEmbeddings> {
    try {
      this.updateStatus({
        status: 'processing',
        message: 'Generating embeddings...',
        details: {
          stage: 'embedding',
          processedSections: 0,
          totalSections: sections.length
        }
      });

      // Process sections in batches to avoid rate limits
      const batchSize = 5;
      const embeddings: DocumentEmbeddings['sections'] = [];
      
      for (let i = 0; i < sections.length; i += batchSize) {
        const batch = sections.slice(i, i + batchSize);
        const batchPromises = batch.map(async (section) => {
          // TODO: Replace with actual embedding generation
          // For now, return mock embeddings
          const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
          
          return {
            id: section.id,
            embedding: mockEmbedding,
            content: section.content,
            metadata: section.metadata
          };
        });

        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);

        this.updateStatus({
          details: {
            stage: 'embedding',
            processedSections: embeddings.length,
            totalSections: sections.length
          },
          progress: (embeddings.length / sections.length) * 100
        });
      }

      return {
        documentId: 'doc-id', // This should be passed in
        sections: embeddings,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      const errorDetails: ErrorDetails = {
        code: 'EMBEDDING_FAILED',
        message: 'Failed to generate embeddings',
        severity: 'high',
        retry: true,
        context: { error }
      };

      this.updateStatus({
        status: 'error',
        error: errorDetails.message,
        details: {
          stage: 'embedding'
        }
      });

      throw errorDetails;
    }
  }

  private async indexEmbeddings(embeddings: DocumentEmbeddings): Promise<void> {
    try {
      this.updateStatus({
        status: 'processing',
        message: 'Indexing embeddings...',
        details: {
          stage: 'indexing'
        }
      });

      // Store embeddings in Supabase
      const { error } = await this.supabase
        .from('document_embeddings')
        .insert({
          document_id: embeddings.documentId,
          embeddings: embeddings.sections,
          version: embeddings.version,
          created_at: embeddings.createdAt,
          updated_at: embeddings.updatedAt
        });

      if (error) throw error;

      this.updateStatus({
        status: 'success',
        message: 'Document processing complete',
        progress: 100
      });
    } catch (error) {
      const errorDetails: ErrorDetails = {
        code: 'INDEXING_FAILED',
        message: 'Failed to index embeddings',
        severity: 'high',
        retry: true,
        context: { error }
      };

      this.updateStatus({
        status: 'error',
        error: errorDetails.message,
        details: {
          stage: 'indexing'
        }
      });

      throw errorDetails;
    }
  }

  async processDocument(documentId: string, pdfData: ArrayBuffer): Promise<void> {
    try {
      // Extract sections
      const sections = await this.extractSections(pdfData);

      // Generate embeddings
      const embeddings = await this.generateEmbeddings(sections);

      // Index embeddings
      await this.indexEmbeddings({
        ...embeddings,
        documentId
      });
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  getStatus(): ProcessingStatus {
    return this.status;
  }
}

export interface DocumentSection {
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
    type?: 'heading' | 'paragraph' | 'list' | 'table';
  };
}

export interface ProcessingResult {
  sections: DocumentSection[];
  pageCount: number;
}

/**
 * Extract sections from a PDF document
 */
export async function extractPdfSections(pdfBuffer: ArrayBuffer): Promise<ProcessingResult> {
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    const sections: DocumentSection[] = [];

    // Process each page
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      // For now, treat each page as a section
      // In a production environment, we would use more sophisticated text extraction
      sections.push({
        id: `page-${i + 1}`,
        content: `Page ${i + 1} content`, // Placeholder - would use proper text extraction
        metadata: {
          pageNumber: i + 1,
          position: {
            x: 0,
            y: 0,
            width,
            height
          },
          type: 'paragraph'
        }
      });
    }

    return {
      sections,
      pageCount
    };
  } catch (error) {
    throw handleError(error, {
      customMessage: 'Failed to extract sections from PDF',
      context: { fileSize: pdfBuffer.byteLength }
    });
  }
}

/**
 * Detect section type based on content and formatting
 * This is a placeholder - in production, we would use more sophisticated analysis
 */
function detectSectionType(content: string): DocumentSection['metadata']['type'] {
  if (content.split('\n').length === 1 && content.length < 100) {
    return 'heading';
  }
  if (content.includes('\n• ') || content.includes('\n* ')) {
    return 'list';
  }
  if (content.includes('|') && content.includes('\n')) {
    return 'table';
  }
  return 'paragraph';
}

/**
 * Process a document section to extract metadata and clean content
 */
export function processSection(
  rawContent: string,
  pageNumber: number,
  position: DocumentSection['metadata']['position']
): DocumentSection {
  const content = rawContent.trim();
  const type = detectSectionType(content);
  
  return {
    id: `section-${pageNumber}-${Math.floor(position.y)}`,
    content,
    metadata: {
      pageNumber,
      position,
      type
    }
  };
} 