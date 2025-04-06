'use client';

import { useDocumentEditing } from '@/hooks/useDocumentEditing';
import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { Check, X } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

interface EditableDocumentViewerProps {
  // If the component doesn't need props, we'll use Record<string, never> instead of empty interface
  readonly _props?: never;
}

export interface EditableDocumentViewerRef {
  proposeEditFromAI: (sectionId: string, newText: string) => void;
  highlightSection: (sectionId: string | null) => void;
  getSections: () => EditableSection[];
}

interface EditableSection {
  id: string;
  title?: string;
  text: string;
  proposedText?: string;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const EditableDocumentViewer = forwardRef<EditableDocumentViewerRef, EditableDocumentViewerProps>((props, ref) => {
  console.log('[EditableDocumentViewer] Component rendered');
  
  const {
    sections,
    highlightedSection,
    setHighlightedSection,
    proposeEdit,
    acceptEdit,
    rejectEdit,
    hasDocument
  } = useDocumentEditing();
  
  // Handle section highlighting with scrolling
  useEffect(() => {
    if (highlightedSection) {
      console.log('[EditableDocumentViewer] Highlighting section:', highlightedSection);
      // Find the element and scroll to it
      const element = document.getElementById(`section-${highlightedSection}`);
      if (element) {
        console.log('[EditableDocumentViewer] Scrolling to highlighted section');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.log('[EditableDocumentViewer] Could not find section element to highlight');
      }
    }
  }, [highlightedSection]);

  // Expose functions through the ref
  useImperativeHandle(ref, () => {
    console.log('[EditableDocumentViewer] Exposing functions via ref');
    return {
      proposeEditFromAI: (sectionId: string, newText: string) => {
        console.log('[EditableDocumentViewer] AI proposing edit for section:', sectionId);
        setHighlightedSection(sectionId);
        proposeEdit(sectionId, newText);
      },
      highlightSection: (sectionId: string | null) => {
        console.log('[EditableDocumentViewer] Setting highlighted section:', sectionId);
        setHighlightedSection(sectionId);
      },
      getSections: () => sections
    };
  }, [sections, setHighlightedSection, proposeEdit]);

  if (!hasDocument) {
    return (
      <ErrorBoundary>
        <div className="w-full h-[600px] flex items-center justify-center border rounded-lg">
          <p className="text-gray-500">No document loaded</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="border rounded-lg w-full overflow-hidden">
        <div className="bg-gray-100 p-2 border-b">
          <h3 className="font-medium truncate">
            {sections[0]?.title || 'Untitled Document'}
          </h3>
        </div>
        <div className="w-full h-[600px] overflow-y-auto p-4">
          {sections.map((section) => (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className={`mb-6 p-4 border rounded-lg transition-all ${
                highlightedSection === section.id
                  ? 'bg-yellow-50 border-yellow-400 shadow-md'
                  : 'border-gray-200'
              }`}
              onClick={() => {
                console.log('[EditableDocumentViewer] Section clicked:', section.id);
                setHighlightedSection(section.id);
              }}
            >
              {section.title && (
                <h4 className="font-medium text-lg mb-2">{section.title}</h4>
              )}
              
              <div className="text-gray-800 whitespace-pre-wrap">
                {section.text}
              </div>
              
              {/* Show proposed edit if available */}
              {section.proposedText && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex flex-row justify-between items-center mb-2">
                    <h5 className="font-medium text-sm text-blue-600">Suggested Edit:</h5>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[EditableDocumentViewer] Accept button clicked for section:', section.id);
                          acceptEdit(section.id);
                        }}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                        aria-label="Accept edit"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[EditableDocumentViewer] Reject button clicked for section:', section.id);
                          rejectEdit(section.id);
                        }}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                        aria-label="Reject edit"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 text-gray-800 whitespace-pre-wrap">
                    {section.proposedText}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
});

// Add proper display name
EditableDocumentViewer.displayName = 'EditableDocumentViewer'; 