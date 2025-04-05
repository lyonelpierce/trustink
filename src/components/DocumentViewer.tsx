'use client';

import { useDocumentStore } from '@/store/zustand';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Loader2 } from 'lucide-react';

export function DocumentViewer() {
  const { currentDocument, highlightedSection } = useDocumentStore();
  const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderPDF = useCallback(async () => {
    if (!currentDocument?.pdfBytes) return;
    
    setIsLoading(true);
    try {
      const pdfDoc = await PDFDocument.load(currentDocument.pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      const pages: HTMLCanvasElement[] = [];
      
      // Use PDF.js or a similar library to render PDF pages to canvas
      // This is a simplified placeholder implementation
      for (let i = 0; i < pageCount; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 800; // Fixed width for now
        canvas.height = 1000; // Fixed height for now, ideally should be proportional
        canvas.dataset.pageNumber = (i + 1).toString();
        
        // Draw a page placeholder
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#e0e0e0';
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#888888';
          ctx.font = '14px Arial';
          ctx.fillText(`Page ${i + 1}`, 20, 30);
        }
        
        pages.push(canvas);
      }
      
      setRenderedPages(pages);
    } catch (error) {
      console.error('Error rendering PDF:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDocument]);

  // Highlight a section when highlightedSection changes
  useEffect(() => {
    if (!highlightedSection || !containerRef.current) return;
    
    const section = currentDocument?.parsedContent?.sections.find(
      s => s.id === highlightedSection
    );
    
    if (section) {
      // Scroll to the section
      const pageElement = containerRef.current.querySelector(
        `[data-page-number="${section.pageNumber}"]`
      );
      
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add visual highlight (in a real implementation, this would be more sophisticated)
        const ctx = (pageElement as HTMLCanvasElement).getContext('2d');
        if (ctx) {
          // Clear any previous highlights
          renderPDF();
          
          // Draw highlight
          setTimeout(() => {
            if (ctx) {
              ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
              ctx.fillRect(50, 50, 700, 100); // This would use actual section coordinates
              
              ctx.fillStyle = '#333';
              ctx.font = 'bold 14px Arial';
              ctx.fillText('Highlighted Section', 60, 70);
            }
          }, 100);
        }
      }
    }
  }, [highlightedSection, currentDocument, renderPDF]);

  // Render the PDF when document changes
  useEffect(() => {
    if (currentDocument?.pdfBytes) {
      renderPDF();
    } else {
      setRenderedPages([]);
    }
  }, [currentDocument, renderPDF]);

  if (!currentDocument) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center border rounded-lg">
        <p className="text-gray-500">No document loaded</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center border rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-500">Loading document...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg w-full overflow-hidden">
      <div className="bg-gray-100 p-2 border-b">
        <h3 className="font-medium truncate">{currentDocument.name}</h3>
      </div>
      <div 
        ref={containerRef} 
        className="w-full h-[600px] overflow-y-auto p-4 flex flex-col items-center gap-4"
      >
        {renderedPages.map((canvas, index) => (
          <div 
            key={`page-${index}`} 
            className="w-full flex justify-center"
          >
            <div 
              dangerouslySetInnerHTML={{ 
                __html: canvas.outerHTML 
              }} 
              className="shadow-md"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 