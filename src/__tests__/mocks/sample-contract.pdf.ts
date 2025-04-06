/**
 * This file contains a base64-encoded mock PDF contract that can be used for testing.
 * The encoded data represents a simple contract document with standard sections.
 */

export const mockContractPdfBase64 = `
JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDMwMD4+c3RyZWFtCnicbVLBbtswDP2V7hj0YMm2ahtYh2TDjktaHXIbiq2GgthDaCc/X9G2aawNfKB4FMHHxydiIK0VHGRsBXsJI81jC2s4vc5wGgeYZhjbAb4zD1Bh/9KtFa7w9ZTH1wGSYGcV6iCckITgqUaF/fnxfH6o8ODZQcD34J8SomVKdYj+gOtXXeRaJXsQsm4UaG0ywJSzZYpfgUzxsAQiVZRnMlSCWlTYdHALHqzC0LVk0EZTzSsj9XNJBr1gO1W7AUNsG7wz0YHFwOxizLFvuq4jEaU6vE3YX3t3i6fMFe3aCDuDe5RCXCPHRHPDxJTHGxAXG/r/9OiavgujWfSULYeYTRmTVf6+NsRRHe19uNJdyE3+K3/E8RwGONlIBkP40vXp99mZeGrKmEZn0K6Xzr/5DqSjZXEKZW5kc3RyZWFtCmVuZG9iagozIDAgb2JqCjw8L1R5cGUgL1BhZ2UvQ29udGVudHMgNSAwIFIvUmVzb3VyY2VzPDwvUHJvY1NldFsvUERGL1RleHQvSW1hZ2VCL0ltYWdlQy9JbWFnZUldL0ZvbnQ8PC9GMSAxIDAgUi9GMiAyIDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCA0IDAgUj4+CmVuZG9iagoxIDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYS1Cb2xkL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYS9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKNiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNCAwIFI+PgplbmRvYmoKNyAwIG9iago8PC9Qcm9kdWNlcihQREZLaXQpL0NyZWF0aW9uRGF0ZShEOjIwMjQwNDA2MTMwMDAwWikvTW9kRGF0ZShEOjIwMjQwNDA2MTMwMDAwWik+PgplbmRvYmoKeHJlZgowIDgKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwNTAwIDAwMDAwIG4gCjAwMDAwMDA1OTEgMDAwMDAgbiAKMDAwMDAwMDM5OSAwMDAwMCBuIAowMDAwMDAwNjc5IDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDczMCAwMDAwMCBuIAowMDAwMDAwNzc0IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA4L1Jvb3QgNiAwIFIvSW5mbyA3IDAgUi9JRCBbPDkxNTZmNDNmZjc0YmQ1ZTU0MTQ5OGEwY2I5N2I5NWMyPjw5MTU2ZjQzZmY3NGJkNWU1NDE0OThhMGNiOTdiOTVjMj5dPj4Kc3RhcnR4cmVmCjg2NAolJUVPRgo=
`;

/**
 * Creates a File object from the base64 encoded mock PDF
 */
export function createMockContractPdf(name = 'sample-contract.pdf'): File {
  // Decode base64 string
  const byteCharacters = atob(mockContractPdfBase64.trim());
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  const blob = new Blob(byteArrays, { type: 'application/pdf' });
  return new File([blob], name, { type: 'application/pdf' });
}

/**
 * Returns a mock PDF document with contract sections
 */
export const mockContractSections = [
  {
    id: 'section-1',
    title: 'Service Agreement',
    text: 'This Service Agreement (the "Agreement") is entered into as of the date of signature below, by and between Company ABC ("Provider") and the undersigned client ("Client").',
    pageNumber: 1,
    position: { x: 50, y: 50, width: 500, height: 100 }
  },
  {
    id: 'section-2',
    title: '1. Services',
    text: 'Provider agrees to provide Client with software development and consulting services as described in Exhibit A (the "Services"). Provider shall perform the Services in a professional manner and in accordance with industry standards.',
    pageNumber: 1,
    position: { x: 50, y: 160, width: 500, height: 120 }
  },
  {
    id: 'section-3',
    title: '2. Compensation',
    text: 'Client agrees to pay Provider for the Services at the rates specified in Exhibit B. Provider shall invoice Client on a monthly basis, and Client shall pay all invoices within thirty (30) days of receipt.',
    pageNumber: 1,
    position: { x: 50, y: 290, width: 500, height: 100 }
  },
  {
    id: 'section-4',
    title: '3. Term and Termination',
    text: 'This Agreement shall commence on the effective date and continue until the Services are completed, unless earlier terminated. Either party may terminate this Agreement with thirty (30) days written notice to the other party.',
    pageNumber: 1,
    position: { x: 50, y: 400, width: 500, height: 120 }
  },
  {
    id: 'section-5',
    title: '4. Intellectual Property',
    text: 'All intellectual property rights in any materials created by Provider in the performance of the Services shall be owned by Client upon full payment of all invoices.',
    pageNumber: 1,
    position: { x: 50, y: 530, width: 500, height: 100 }
  },
  {
    id: 'section-6',
    title: '5. Confidentiality',
    text: 'Each party agrees to maintain the confidentiality of any proprietary information received from the other party during the term of this Agreement and for two (2) years thereafter.',
    pageNumber: 1,
    position: { x: 50, y: 640, width: 500, height: 100 }
  }
];

/**
 * Mock document analysis results for testing
 */
export const mockDocumentAnalysis = {
  riskySections: [
    {
      id: 'section-4',
      title: '3. Term and Termination',
      text: 'This Agreement shall commence on the effective date and continue until the Services are completed, unless earlier terminated. Either party may terminate this Agreement with thirty (30) days written notice to the other party.',
      risk: 'medium',
      explanation: 'The termination clause allows either party to terminate with 30 days notice, which could potentially disrupt ongoing projects.',
      suggestion: 'Consider adding provisions for handling in-progress work and payment upon early termination.'
    },
    {
      id: 'section-5',
      title: '4. Intellectual Property',
      text: 'All intellectual property rights in any materials created by Provider in the performance of the Services shall be owned by Client upon full payment of all invoices.',
      risk: 'high',
      explanation: 'Intellectual property ownership is contingent on full payment, but there are no provisions for partial payment scenarios or dispute resolution.',
      suggestion: 'Add clear language about IP ownership during payment disputes and specific dispute resolution procedures.'
    }
  ],
  summary: 'This is a basic service agreement with standard provisions for services, compensation, termination, IP, and confidentiality. There are some potential risks in the termination and IP clauses that could be addressed.',
  recommendedAction: 'Review and strengthen the termination and intellectual property clauses before signing. Consider adding sections on limitation of liability and dispute resolution.'
}; 