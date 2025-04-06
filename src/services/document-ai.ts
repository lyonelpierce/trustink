/**
 * document-ai.ts
 * A service to analyze documents using AI
 */

// Types for document sections
export interface DocumentSection {
  id: string;
  title: string;
  text: string;
  pageNumber: number;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

// Types of analysis requests
export type AnalysisType = 'general' | 'question' | 'summarize' | 'suggest';

// Analysis request interface
export interface AnalysisRequest {
  type: AnalysisType;
  sections: DocumentSection[];
  question?: string;
  highlightedSectionId?: string;
}

// Analysis response interface
export interface AnalysisResponse {
  summary: string;
  suggestions?: string[];
  riskySections?: DocumentSection[];
  error?: string;
}

/**
 * Analyzes document sections using AI
 * 
 * @param request The analysis request containing document sections and type of analysis
 * @returns Analysis response with summary, suggestions, etc.
 */
export async function analyzeDocument(request: AnalysisRequest): Promise<AnalysisResponse> {
  // Validate request
  if (!request.sections || request.sections.length === 0) {
    return {
      summary: '',
      error: 'No document sections provided for analysis'
    };
  }

  if (request.type === 'question' && (!request.question || request.question.trim() === '')) {
    return {
      summary: '',
      error: 'No question provided for analysis'
    };
  }

  // In a real implementation, this would call an OpenAI or similar API
  // For testing purposes, provide mock responses based on request type

  // Add a small delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));

  switch (request.type) {
    case 'general':
      return mockGeneralAnalysis(request);
    
    case 'question':
      return mockQuestionAnalysis(request);
    
    case 'summarize':
      return mockSummarize(request);
    
    case 'suggest':
      return mockSuggest(request);
    
    default:
      return {
        summary: 'Analysis type not supported',
        error: 'Unsupported analysis type'
      };
  }
}

// Mock implementations

function mockGeneralAnalysis(request: AnalysisRequest): AnalysisResponse {
  const sectionCount = request.sections.length;
  const titles = request.sections.map(s => s.title).join(', ');
  
  return {
    summary: `This document contains ${sectionCount} sections: ${titles}. It appears to be a legal agreement with terms and conditions.`,
    riskySections: request.sections.filter(s => 
      s.text.toLowerCase().includes('terminate') || 
      s.text.toLowerCase().includes('liability') ||
      s.title.toLowerCase().includes('termination')
    )
  };
}

function mockQuestionAnalysis(request: AnalysisRequest): AnalysisResponse {
  const question = request.question?.toLowerCase() || '';
  const highlightedSection = request.highlightedSectionId ? 
    request.sections.find(s => s.id === request.highlightedSectionId) : 
    undefined;
  
  // If there's a highlighted section, focus on that
  if (highlightedSection) {
    return {
      summary: `The section "${highlightedSection.title}" states: ${highlightedSection.text}`,
      riskySections: highlightedSection.text.toLowerCase().includes('terminate') ? 
        [highlightedSection] : undefined
    };
  }
  
  // Check for specific questions
  if (question.includes('payment')) {
    const paymentSection = request.sections.find(s => 
      s.text.toLowerCase().includes('payment') || 
      s.text.toLowerCase().includes('pay')
    );
    
    if (paymentSection) {
      return {
        summary: `The payment terms are specified as net 30 days in the ${paymentSection.title} section.`
      };
    }
  }
  
  if (question.includes('risk') || question.includes('risks')) {
    const riskySections = request.sections.filter(s => 
      s.text.toLowerCase().includes('terminate') || 
      s.text.toLowerCase().includes('liability') ||
      s.title.toLowerCase().includes('termination')
    );
    
    return {
      summary: `The document contains potential risks related to termination terms in section ${riskySections[0]?.title || 'Termination'}.`,
      riskySections
    };
  }
  
  // Generic response
  return {
    summary: `Based on my analysis of the document, ${request.question}`
  };
}

function mockSummarize(request: AnalysisRequest): AnalysisResponse {
  const sectionCount = request.sections.length;
  const pageCount = Math.max(...request.sections.map(s => s.pageNumber));
  
  return {
    summary: `This ${pageCount}-page document contains an agreement with ${sectionCount} key sections including: ${request.sections.map(s => s.title).join(', ')}. It defines the terms and conditions between parties, payment terms, and termination conditions.`
  };
}

function mockSuggest(request: AnalysisRequest): AnalysisResponse {
  const highlightedSection = request.highlightedSectionId ? 
    request.sections.find(s => s.id === request.highlightedSectionId) : 
    request.sections[0];
  
  if (!highlightedSection) {
    return {
      summary: 'No specific section to analyze for suggestions',
      suggestions: []
    };
  }
  
  if (highlightedSection.title.includes('Terms')) {
    return {
      summary: `Suggestions for the "${highlightedSection.title}" section:`,
      suggestions: [
        'Add more clarity around the specific services covered',
        'Specify the currency for payments',
        'Consider adding late payment penalties',
        'Add a clause about minimum service levels'
      ]
    };
  }
  
  if (highlightedSection.title.includes('Termination')) {
    return {
      summary: `Suggestions for the "${highlightedSection.title}" section:`,
      suggestions: [
        'Specify conditions under which no notice is required',
        'Add details about handling unfinished work',
        'Include information about refunds',
        'Clarify post-termination obligations'
      ]
    };
  }
  
  // Generic suggestions
  return {
    summary: `Suggestions for the "${highlightedSection.title}" section:`,
    suggestions: [
      'Consider adding more specific details',
      'Use simpler language for clarity',
      'Add examples where appropriate',
      'Consider including definitions for technical terms'
    ]
  };
} 