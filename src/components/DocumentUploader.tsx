'use client';

import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { FileUp, Loader2, AlertCircle } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

export function DocumentUploader() {
  console.log('[DocumentUploader] Component rendered');
  
  const {
    dragActive,
    setDragActive,
    uploadError,
    lastFile,
    processFile,
    isProcessing
  } = useDocumentUpload();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) {
      console.log('[DocumentUploader] Drag active');
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[DocumentUploader] Drag inactive');
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      console.log('[DocumentUploader] File dropped:', e.dataTransfer.files[0].name);
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      console.log('[DocumentUploader] File selected:', e.target.files[0].name);
      processFile(e.target.files[0]);
    }
  };

  const handleRetry = () => {
    if (lastFile) {
      console.log('[DocumentUploader] Retrying upload with file:', lastFile.name);
      processFile(lastFile);
    } else {
      document.getElementById('file-upload')?.click();
    }
  };

  return (
    <ErrorBoundary>
      <div className="w-full max-w-xl mx-auto">
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${isProcessing ? 'pointer-events-none opacity-70' : ''}
            ${uploadError ? 'border-red-300 bg-red-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={uploadError ? handleRetry : () => document.getElementById('file-upload')?.click()}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
              <p className="text-sm text-gray-500">Processing document...</p>
            </div>
          ) : uploadError ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="text-sm text-red-600 font-medium">{uploadError}</p>
              <button 
                className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <FileUp className="h-10 w-10 mb-3 text-gray-400" />
              <p className="mb-2 text-lg font-semibold">Upload your document</p>
              <p className="text-sm text-gray-500 mb-2 text-center">
                Drag and drop a PDF file or click to browse
              </p>
              <p className="text-xs text-gray-400 text-center">
                Maximum file size: 10MB
              </p>
              <input
                id="file-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleChange}
              />
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
} 