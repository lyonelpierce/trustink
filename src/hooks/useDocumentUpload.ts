import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { useDocumentStore } from '@/store/zustand';
import { handleError, safeAsync } from '@/lib/error-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useDocumentUpload() {
  const { setCurrentDocument, setDocumentLoading } = useDocumentStore();
  const [dragActive, setDragActive] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateFile = useCallback((file: File) => {
    // Reset error state
    setUploadError(null);
    setLastFile(file);
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      console.log('[useDocumentUpload] Invalid file type:', file.type);
      setUploadError('Please upload a PDF file');
      toast.error('Please upload a PDF file');
      return false;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log('[useDocumentUpload] File too large:', Math.round(file.size / (1024 * 1024)), 'MB');
      setUploadError(`File size exceeds 10MB limit`);
      toast.error(`File size exceeds 10MB limit`);
      return false;
    }
    
    return true;
  }, []);

  const processFile = useCallback(async (file: File) => {
    console.log('[useDocumentUpload] Processing file:', file.name);
    
    if (!validateFile(file)) {
      return null;
    }

    try {
      setDocumentLoading(true);
      
      // Read the file as ArrayBuffer
      const [arrayBuffer, readError] = await safeAsync(
        file.arrayBuffer(),
        { context: 'useDocumentUpload.readFile', showToast: false }
      );
      
      if (readError || !arrayBuffer) {
        setUploadError('Failed to read PDF file');
        throw new Error('Failed to read PDF file');
      }
      
      // Process PDF
      const uint8Array = new Uint8Array(arrayBuffer);
      const [pdfDoc, pdfError] = await safeAsync(
        PDFDocument.load(uint8Array),
        { context: 'useDocumentUpload.parsePDF', showToast: false }
      );
      
      if (pdfError || !pdfDoc) {
        setUploadError('Failed to parse PDF document');
        throw new Error('Failed to parse PDF document');
      }

      // Upload to API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      
      const [response, uploadError] = await safeAsync(
        fetch('/api/documents', {
          method: 'POST',
          body: formData,
        }).then(res => {
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          return res.json();
        }),
        { context: 'useDocumentUpload.uploadDocument', showToast: false }
      );
      
      if (uploadError || !response) {
        setUploadError('Failed to upload document');
        throw new Error('Failed to upload document');
      }
      
      // Extract basic sections (simplified)
      const pageCount = pdfDoc.getPageCount();
      const sections = Array.from({ length: pageCount }, (_, i) => {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        return {
          id: `page-${i+1}`,
          title: `Page ${i+1}`,
          text: `Content from page ${i+1}`,
          pageNumber: i+1,
          position: { x: 0, y: 0, width, height }
        };
      });
      
      // Set the document in the store
      setCurrentDocument({
        id: response.id,
        name: file.name,
        file: file,
        pdfBytes: uint8Array,
        parsedContent: { sections }
      });
      
      console.log('[useDocumentUpload] Document uploaded successfully');
      toast.success('Document uploaded successfully');
      
      // Reset last file since upload was successful
      setLastFile(null);
      
      return response.id;
    } catch (error) {
      console.error('[useDocumentUpload] Error:', error);
      if (!uploadError) {
        setUploadError('Failed to process PDF');
      }
      handleError(error, {
        context: 'useDocumentUpload',
        customMessage: 'Failed to process PDF'
      });
      return null;
    } finally {
      setDocumentLoading(false);
    }
  }, [setCurrentDocument, setDocumentLoading, uploadError, validateFile]);

  return {
    dragActive,
    setDragActive,
    uploadError,
    lastFile,
    processFile,
    isProcessing: useDocumentStore().isDocumentLoading
  };
} 