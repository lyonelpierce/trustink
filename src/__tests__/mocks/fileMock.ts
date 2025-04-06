/**
 * Mock functions for file testing
 */

/**
 * Creates a mock PDF file for testing uploads
 * @returns A File object with PDF type
 */
export function createMockPdfFile(): File {
  // Create a minimal PDF file (just the header)
  const content = '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  
  const file = new File(
    [content], 
    'test.pdf', 
    { type: 'application/pdf' }
  );
  
  // Add arrayBuffer method
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: function() {
      // Simple mock that returns a buffer with some data
      return Promise.resolve(new Uint8Array([1, 2, 3, 4, 5]).buffer);
    }
  });
  
  return file;
}

/**
 * Creates a mock text file for testing type validation
 * @returns A File object with text/plain type
 */
export function createMockTextFile(): File {
  const content = 'This is a text file';
  const file = new File(
    [content], 
    'test.txt', 
    { type: 'text/plain' }
  );
  
  // Add arrayBuffer method
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: function() {
      // Simple mock that returns a buffer with some data
      return Promise.resolve(new Uint8Array([1, 2, 3, 4, 5]).buffer);
    }
  });
  
  return file;
}

/**
 * Creates a mock FileReader for testing file processing
 */
export class MockFileReader {
  static implementation = {
    readAsArrayBuffer: jest.fn(),
    readAsText: jest.fn(),
    onload: null as any,
    onerror: null as any,
    result: null as any,
  };
  
  static reset() {
    this.implementation.readAsArrayBuffer.mockReset();
    this.implementation.readAsText.mockReset();
    this.implementation.onload = null;
    this.implementation.onerror = null;
    this.implementation.result = null;
  }
  
  static mockSuccess(result: any) {
    this.implementation.readAsArrayBuffer.mockImplementation(function(this: any, blob: Blob) {
      setTimeout(() => {
        this.result = result;
        this.onload && this.onload({ target: this });
      }, 0);
    });
    
    this.implementation.readAsText.mockImplementation(function(this: any, blob: Blob) {
      setTimeout(() => {
        this.result = typeof result === 'string' ? result : 'Mock file content';
        this.onload && this.onload({ target: this });
      }, 0);
    });
  }
  
  static mockError(error: Error) {
    this.implementation.readAsArrayBuffer.mockImplementation(function(this: any, blob: Blob) {
      setTimeout(() => {
        this.error = error;
        this.onerror && this.onerror({ target: this });
      }, 0);
    });
    
    this.implementation.readAsText.mockImplementation(function(this: any, blob: Blob) {
      setTimeout(() => {
        this.error = error;
        this.onerror && this.onerror({ target: this });
      }, 0);
    });
  }
}

// To use MockFileReader, replace the global FileReader before tests:
// global.FileReader = jest.fn().mockImplementation(() => MockFileReader.implementation); 