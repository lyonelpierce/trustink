/**
 * Document AI processing utilities
 * Handles document analysis, question answering, and section enhancement
 */

// Types for document analysis
export interface DocumentSection {
  id: string;
  title?: string;
  text: string;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalysisResult {
  summary: string;
  riskySections?: Array<{
    id: string;
    title: string;
    text: string;
    risk: 'high' | 'medium' | 'low';
    explanation: string;
    suggestion: string;
  }>;
  recommendedAction?: string;
  keyTerms?: Record<string, string>;
  parties?: string[];
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    analysis: string;
    riskLevel: 'high' | 'medium' | 'low' | 'none';
    suggestedChanges?: string;
  }>;
  errorMessage?: string;
}

export interface AnalysisRequest {
  documentId: string;
  question?: string;
  highlightedSectionId?: string | null;
  requestType?: 'analyze' | 'summarize' | 'suggest' | 'risks';
  sections?: DocumentSection[];
}

/**
 * Process document content using AI
 */
export async function analyzeDocument(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    console.log('[document-ai] Processing document analysis request:', request.requestType);
    
    // If we have a specific question, process it
    if (request.question) {
      return await processDocumentQuestion(
        request.question,
        request.highlightedSectionId,
        request.sections || []
      );
    }
    
    // Handle different request types
    switch (request.requestType) {
      case 'summarize':
        return await summarizeDocument();
      case 'suggest':
        return await suggestImprovements(request.highlightedSectionId, request.sections || []);
      case 'risks':
        return createMockRiskResponse(request.sections || []);
      case 'analyze':
      default:
        return await performDocumentAnalysis();
    }
  } catch (error) {
    console.error('[document-ai] Error analyzing document:', error);
    return {
      summary: 'An error occurred while analyzing the document.',
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Process a question about a document
 */
async function processDocumentQuestion(
  question: string,
  highlightedSectionId: string | null | undefined,
  documentSections: DocumentSection[]
): Promise<AnalysisResult> {
  let contextType = 'full document';
  
  if (highlightedSectionId) {
    const section = documentSections.find(s => s.id === highlightedSectionId);
    if (section) {
      contextType = `section "${section.title || section.id}"`;
    }
  }
  
  console.log(`[document-ai] Processing question about ${contextType}: "${question}"`);
  
  // In a production environment, this would use the OpenAI API
  // For now, return mock responses based on question patterns
  
  // Keywords to look for in the question for mock responses
  if (question.toLowerCase().includes('risk')) {
    return createMockRiskResponse(documentSections);
  }
  
  if (question.toLowerCase().includes('summarize') || question.toLowerCase().includes('summary')) {
    return await summarizeDocument();
  }
  
  if (highlightedSectionId) {
    return createMockSectionResponse(documentSections, highlightedSectionId);
  }
  
  // Default response
  return {
    summary: `I've analyzed your question: "${question}". In a production environment, I would use the OpenAI API to generate a specific response based on the document content.`,
    recommendedAction: 'For more accurate responses, highlight a specific section before asking a question.'
  };
}

/**
 * Create a comprehensive document analysis
 */
async function performDocumentAnalysis(): Promise<AnalysisResult> {
  console.log('[document-ai] Performing comprehensive document analysis');
  
  // In production, this would call OpenAI API
  // For now, create a mock analysis
  return {
    summary: 'This document appears to be a service agreement with standard provisions for services, compensation, term, intellectual property, and confidentiality.',
    riskySections: [
      {
        id: 'section-4',
        title: 'Term and Termination',
        text: 'Termination clause',
        risk: 'medium',
        explanation: 'The termination clause allows either party to terminate with 30 days notice, which could disrupt ongoing work.',
        suggestion: 'Consider adding provisions for handling in-progress work and payment upon early termination.'
      },
      {
        id: 'section-5',
        title: 'Intellectual Property',
        text: 'IP clause',
        risk: 'high',
        explanation: 'Intellectual property ownership is contingent on full payment, but there are no provisions for partial payment scenarios.',
        suggestion: 'Add clear language about IP ownership during payment disputes and specific dispute resolution procedures.'
      }
    ],
    recommendedAction: 'Review and strengthen the termination and intellectual property clauses before signing.',
    keyTerms: {
      'Services': 'Software development and consulting services',
      'Client': 'The party receiving services',
      'Provider': 'The party providing services'
    },
    parties: ['Provider (Company ABC)', 'Client (undersigned)']
  };
}

/**
 * Summarize document content
 */
async function summarizeDocument(): Promise<AnalysisResult> {
  console.log('[document-ai] Generating document summary');
  
  // In production, this would call OpenAI API
  return {
    summary: 'This is a service agreement between Company ABC (Provider) and the client. It outlines the services to be provided, compensation terms, termination conditions, intellectual property rights, and confidentiality obligations. The agreement has standard provisions but contains some potential risks in the termination and intellectual property clauses that should be reviewed.',
    recommendedAction: 'Review the full document with particular attention to the IP and termination clauses.'
  };
}

/**
 * Suggest improvements for document sections
 */
async function suggestImprovements(
  highlightedSectionId: string | null | undefined,
  documentSections: DocumentSection[]
): Promise<AnalysisResult> {
  console.log('[document-ai] Suggesting improvements');
  
  // If we have a specific section, focus on that
  if (highlightedSectionId) {
    const section = documentSections.find(s => s.id === highlightedSectionId);
    if (section) {
      console.log(`[document-ai] Suggesting improvements for section: ${section.title || section.id}`);
      
      // In production, this would use the OpenAI API
      return {
        summary: `I've analyzed section "${section.title || 'the selected section'}" and found potential improvements.`,
        sections: [{
          id: section.id,
          title: section.title || 'Selected Section',
          content: section.text,
          analysis: 'This section could be more specific and provide additional protections.',
          riskLevel: 'medium',
          suggestedChanges: `${section.text}\n\nConsider adding the following: [Suggested improvements would be generated by OpenAI in production]`
        }]
      };
    }
  }
  
  // If no specific section, provide general suggestions
  return {
    summary: 'Based on my analysis, I have several suggestions to improve the document clarity and legal protections.',
    sections: documentSections.slice(0, 3).map(section => ({
      id: section.id,
      title: section.title || section.id,
      content: section.text,
      analysis: 'This section could benefit from more specific language.',
      riskLevel: 'low',
      suggestedChanges: 'In a production environment, I would provide specific suggestions generated by OpenAI.'
    }))
  };
}

/**
 * Create a mock response for risk-related questions
 */
function createMockRiskResponse(documentSections: DocumentSection[]): AnalysisResult {
  return {
    summary: 'I identified two sections with potential risks in this document.',
    riskySections: [
      {
        id: documentSections.find(s => s.title?.includes('Term'))?.id || 'section-4',
        title: documentSections.find(s => s.title?.includes('Term'))?.title || 'Term and Termination',
        text: documentSections.find(s => s.title?.includes('Term'))?.text || 'Termination clause',
        risk: 'medium',
        explanation: 'The termination clause allows either party to terminate with 30 days notice, which could disrupt ongoing work.',
        suggestion: 'Consider adding provisions for handling in-progress work and payment upon early termination.'
      },
      {
        id: documentSections.find(s => s.title?.includes('Intellectual'))?.id || 'section-5',
        title: documentSections.find(s => s.title?.includes('Intellectual'))?.title || 'Intellectual Property',
        text: documentSections.find(s => s.title?.includes('Intellectual'))?.text || 'IP clause',
        risk: 'high',
        explanation: 'Intellectual property ownership is contingent on full payment, but there are no provisions for partial payment scenarios.',
        suggestion: 'Add clear language about IP ownership during payment disputes and specific dispute resolution procedures.'
      }
    ],
    recommendedAction: 'Review and strengthen the termination and intellectual property clauses before signing.'
  };
}

/**
 * Create a mock response for section-specific questions
 */
function createMockSectionResponse(
  documentSections: DocumentSection[],
  sectionId: string
): AnalysisResult {
  const section = documentSections.find(s => s.id === sectionId);
  
  if (!section) {
    return {
      summary: 'I couldn\'t find the specific section you\'re asking about.'
    };
  }
  
  return {
    summary: `I've analyzed the "${section.title || 'selected'}" section.`,
    sections: [{
      id: section.id,
      title: section.title || 'Selected Section',
      content: section.text,
      analysis: 'This section contains standard language for this type of document, but could be more specific in certain areas.',
      riskLevel: section.title?.includes('Intellectual') ? 'high' : 'low',
      suggestedChanges: section.title?.includes('Intellectual') 
        ? 'Consider clarifying the ownership rights during payment disputes and adding specific dispute resolution procedures.'
        : 'The language is generally appropriate, but could benefit from more specific examples or definitions.'
    }]
  };
} 