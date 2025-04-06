import { analyzeDocument, DocumentSection, AnalysisRequest } from '@/services/document-ai';

describe('analyzeDocument', () => {
  // Define test data - sections of a document
  const testSections: DocumentSection[] = [
    {
      id: 'section-1',
      title: 'Introduction',
      text: 'This agreement outlines the terms and conditions between the parties.',
      pageNumber: 1,
      position: { top: 0, left: 0, width: 100, height: 50 }
    },
    {
      id: 'section-2',
      title: 'Terms and Conditions',
      text: 'The customer agrees to pay for services rendered. Payment terms are net 30 days.',
      pageNumber: 1,
      position: { top: 50, left: 0, width: 100, height: 100 }
    },
    {
      id: 'section-3',
      title: 'Termination',
      text: 'Either party may terminate this agreement with 30 days written notice.',
      pageNumber: 2,
      position: { top: 0, left: 0, width: 100, height: 50 }
    }
  ];

  test('processes general document analysis requests', async () => {
    const request: AnalysisRequest = {
      type: 'general',
      sections: testSections
    };
    
    const result = await analyzeDocument(request);
    
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  test('processes specific questions about the document', async () => {
    const request: AnalysisRequest = {
      type: 'question',
      question: 'What are the payment terms?',
      sections: testSections
    };
    
    const result = await analyzeDocument(request);
    
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary).toContain('30 days');
  });

  test('handles questions with highlighted section context', async () => {
    const request: AnalysisRequest = {
      type: 'question',
      question: 'Explain this section',
      sections: testSections,
      highlightedSectionId: 'section-3'
    };
    
    const result = await analyzeDocument(request);
    
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary).toContain('terminate');
  });

  test('summarizes the document when requested', async () => {
    const request: AnalysisRequest = {
      type: 'summarize',
      sections: testSections
    };
    
    const result = await analyzeDocument(request);
    
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(20);
  });

  test('suggests improvements for highlighted sections', async () => {
    const request: AnalysisRequest = {
      type: 'suggest',
      sections: testSections,
      highlightedSectionId: 'section-2'
    };
    
    const result = await analyzeDocument(request);
    
    expect(result).toBeDefined();
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions?.length).toBeGreaterThan(0);
  });

  test('handles errors gracefully', async () => {
    const request: AnalysisRequest = {
      type: 'question',
      question: '',  // Invalid empty question
      sections: []   // No sections
    };
    
    const result = await analyzeDocument(request);
    
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
  });

  test('provides risk assessment when asked about risks', async () => {
    const request: AnalysisRequest = {
      type: 'question',
      question: 'What are the risks in this agreement?',
      sections: testSections
    };
    
    const result = await analyzeDocument(request);
    
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.riskySections).toBeDefined();
  });
}); 