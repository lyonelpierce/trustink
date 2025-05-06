"use client";

import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

/**
 * DemoModeIndicator component
 * 
 * Displays a banner indicating that the application is in demo mode
 * with mock data being used instead of real data.
 * 
 * @param props - Component properties
 * @param props.className - Additional CSS classes
 * @param props.showAlert - Whether to show as an alert (with AlertCircle icon)
 * @param props.children - Optional custom content
 */
export function DemoModeIndicator({
  className = '',
  showAlert = false,
  children,
}: {
  className?: string;
  showAlert?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div 
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
        showAlert 
          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
          : 'bg-blue-50 text-blue-800 border border-blue-200'
      } ${className}`}
      data-testid="demo-mode-indicator"
    >
      {showAlert ? (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <Info className="h-4 w-4 flex-shrink-0" />
      )}
      <div>
        {children || (
          <>
            <span className="font-semibold">Demo Mode:</span> Using mock data for demonstration purposes.
          </>
        )}
      </div>
    </div>
  );
} 