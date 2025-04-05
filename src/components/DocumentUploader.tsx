'use client';

import { useDocumentStore } from '@/store/zustand';
import { PDFDocument } from 'pdf-lib';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FileUp, Loader2 } from 'lucide-react';
import { handleError, safeAsync } from '@/lib/error-utils';
import ErrorBoundary from '@/components/ErrorBoundary';

export function DocumentUploader() {
  const { setCurrentDocument, setDocumentLoading, isDocumentLoading } = useDocumentStore();
  const [dragActive, setDragActive] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      setDocumentLoading(true);
      
      // Read the file
      const [arrayBuffer, readError] = await safeAsync(
        file.arrayBuffer(),
        { context: 'processFile.readFile', showToast: false }
      );
      
      if (readError || !arrayBuffer) {
        throw new Error('Failed to read PDF file');
      }
      
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Parse the PDF
      const [pdfDoc, pdfError] = await safeAsync(
        PDFDocument.load(uint8Array),
        { context: 'processFile.parsePDF', showToast: false }
      );
      
      if (pdfError || !pdfDoc) {
        throw new Error('Failed to parse PDF document');
      }
      
      // Extract text from PDF (simplified version)
      // In a real implementation, we would use a more robust text extraction
      const sections = [];
      const pageCount = pdfDoc.getPageCount();
      
      // Create a basic parsed structure with page numbers for now
      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        sections.push({
          id: `page-${i+1}`,
          title: `Page ${i+1}`,
          text: `Content from page ${i+1}`,
          pageNumber: i+1,
          position: { x: 0, y: 0, width, height }
        });
      }
      
      // Set the document in the store
      setCurrentDocument({
        name: file.name,
        file: file,
        pdfBytes: uint8Array,
        parsedContent: {
          sections: sections
        }
      });
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      handleError(error, {
        context: 'processFile',
        customMessage: 'Failed to process PDF'
      });
    } finally {
      setDocumentLoading(false);
    }
  }, [setCurrentDocument, setDocumentLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  }, [dragActive]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  return (
    <ErrorBoundary>
      <div className="w-full max-w-xl mx-auto">
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${isDocumentLoading ? 'pointer-events-none opacity-70' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {isDocumentLoading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
              <p className="text-sm text-gray-500">Processing document...</p>
            </div>
          ) : (
            <>
              <FileUp className="h-10 w-10 mb-3 text-gray-400" />
              <p className="mb-2 text-lg font-semibold">Upload your document</p>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Drag and drop a PDF file or click to browse
              </p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleChange}
                disabled={isDocumentLoading}
              />
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
} 