'use client';

import React, { useMemo } from 'react';
import { Diff, Hunk, parseDiff, getChangeKey, tokenize, markEdits } from 'react-diff-view';
import refractor from 'refractor/core';
import js from 'refractor/lang/javascript';
import { RiskAnnotation, RiskLevel } from '@/types';
import { Check, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';

// Import diff view styles
import 'react-diff-view/style/index.css';
// Register languages for syntax highlighting
refractor.register(js);

interface DocumentDiffViewerProps {
  originalText: string;
  proposedText: string;
  language?: string;
  viewType?: 'split' | 'unified';
  onAccept?: () => void;
  onReject?: () => void;
  highlightRisks?: boolean;
  riskAnnotations?: RiskAnnotation[];
  className?: string;
  disabled?: boolean;
  status?: 'pending' | 'accepted' | 'rejected';
  aiGenerated?: boolean;
}

/**
 * DocumentDiffViewer component for comparing original and proposed text
 * Uses react-diff-view to display the differences
 */
export function DocumentDiffViewer({
  originalText,
  proposedText,
  language = 'javascript',
  viewType = 'split',
  onAccept,
  onReject,
  highlightRisks = false,
  riskAnnotations = [],
  className = '',
  disabled = false,
  status,
  aiGenerated
}: DocumentDiffViewerProps) {
  // Generate a unified diff
  const diffText = useMemo(() => {
    // Create a simple unified diff format
    const lines = [];
    lines.push('--- a/document');
    lines.push('+++ b/document');
    lines.push('@@ -1,1 +1,1 @@');
    
    originalText.split('\n').forEach(line => {
      lines.push(`-${line}`);
    });
    
    proposedText.split('\n').forEach(line => {
      lines.push(`+${line}`);
    });
    
    return lines.join('\n');
  }, [originalText, proposedText]);
  
  // Parse the diff
  const files = useMemo(() => parseDiff(diffText, { nearbySequences: 'zip' }), [diffText]);
  
  // Early return check for empty files/hunks
  const hasDifferences = files.length > 0 && files[0].hunks && files[0].hunks.length > 0;
  
  // Access file conditionally but declare tokens unconditionally
  const file = hasDifferences ? files[0] : { hunks: null, type: 'modify' };
  
  // Create tokens with syntax highlighting and edits marking
  const tokens = useMemo(() => {
    if (!file.hunks) return null;
    
    try {
      return tokenize(file.hunks, {
        highlight: true,
        refractor,
        language,
        oldSource: originalText,
        enhancers: [markEdits(file.hunks)]
      });
    } catch (error) {
      console.error('Error tokenizing diff:', error);
      return null;
    }
  }, [file.hunks, language, originalText]);
  
  // Create widgets for risk annotations
  const widgets = useMemo(() => {
    if (!highlightRisks || !file.hunks || riskAnnotations.length === 0) return {};
    
    const result: Record<string, React.ReactNode> = {};
    
    riskAnnotations.forEach(annotation => {
      const change = file.hunks
        ?.flatMap(hunk => hunk.changes)
        .find(change => 
          change.lineNumber === annotation.lineNumber || 
          change.oldLineNumber === annotation.lineNumber
        );
      
      if (change) {
        const key = getChangeKey(change);
        result[key] = (
          <RiskAnnotationWidget 
            key={annotation.id}
            riskLevel={annotation.riskLevel}
            explanation={annotation.explanation}
            suggestedChange={annotation.suggestedChange}
            category={annotation.riskCategory}
          />
        );
      }
    });
    
    return result;
  }, [highlightRisks, file.hunks, riskAnnotations]);

  // No files or no differences to display
  if (!hasDifferences) {
    return (
      <div className="p-4 border rounded-md">
        No differences to display
      </div>
    );
  }

  return (
    <div className={`document-diff-viewer rounded-md border overflow-hidden ${className}`}>
      {/* Header with actions */}
      <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {aiGenerated && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              AI Generated
            </span>
          )}
          {status && (
            <span className={`px-2 py-1 text-xs rounded-full ${
              status === 'accepted' ? 'bg-green-100 text-green-700' : 
              status === 'rejected' ? 'bg-red-100 text-red-700' : 
              'bg-yellow-100 text-yellow-700'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        {!disabled && !status && (
          <div className="flex space-x-2">
            {onReject && (
              <button 
                className="px-3 py-1 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm flex items-center hover:bg-red-100 transition-colors"
                onClick={onReject}
              >
                <X size={14} className="mr-1" />
                Reject
              </button>
            )}
            {onAccept && (
              <button 
                className="px-3 py-1 bg-green-50 text-green-600 rounded-md border border-green-200 text-sm flex items-center hover:bg-green-100 transition-colors"
                onClick={onAccept}
              >
                <Check size={14} className="mr-1" />
                Accept
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Diff view */}
      <div className="diff-container overflow-auto max-h-[400px]">
        {file.hunks && (
          <Diff 
            viewType={viewType} 
            diffType={file.type}
            hunks={file.hunks}
            tokens={tokens}
            widgets={widgets}
          >
            {hunks => hunks.map(hunk => (
              <Hunk 
                key={hunk.content} 
                hunk={hunk}
              />
            ))}
          </Diff>
        )}
      </div>
    </div>
  );
}

// Helper component for displaying risk annotations
interface RiskAnnotationWidgetProps {
  riskLevel: RiskLevel;
  explanation: string;
  suggestedChange?: string;
  category: string;
}

function RiskAnnotationWidget({ 
  riskLevel, 
  explanation, 
  suggestedChange,
  category
}: RiskAnnotationWidgetProps) {
  const Icon = 
    riskLevel === 'high' ? AlertCircle : 
    riskLevel === 'medium' ? AlertTriangle : Info;
  
  const colorClass = 
    riskLevel === 'high' ? 'border-red-300 bg-red-50' : 
    riskLevel === 'medium' ? 'border-yellow-300 bg-yellow-50' : 
    'border-blue-300 bg-blue-50';
    
  const textClass = 
    riskLevel === 'high' ? 'text-red-700' : 
    riskLevel === 'medium' ? 'text-yellow-700' : 
    'text-blue-700';

  return (
    <div className={`p-3 rounded-md border ${colorClass} my-2`}>
      <div className="flex items-center mb-2">
        <Icon size={16} className={`mr-2 ${textClass}`} />
        <span className={`text-sm font-medium ${textClass}`}>
          {riskLevel.toUpperCase()} RISK: {category.toUpperCase()}
        </span>
      </div>
      <p className="text-sm mb-2">{explanation}</p>
      {suggestedChange && (
        <div className="text-sm italic border-t border-gray-200 pt-2 mt-2">
          Suggestion: {suggestedChange}
        </div>
      )}
    </div>
  );
} 