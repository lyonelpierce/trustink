"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Interface for the Demo Mode Context value
 */
interface DemoModeContextType {
  /**
   * Whether the application is currently in demo mode
   */
  isDemoMode: boolean;
  
  /**
   * Function to enable demo mode
   */
  enableDemoMode: () => void;
  
  /**
   * Function to disable demo mode
   */
  disableDemoMode: () => void;
  
  /**
   * Whether we're using mock data for the current view
   */
  usingMockData: boolean;
  
  /**
   * Set whether we're using mock data
   */
  setUsingMockData: (value: boolean) => void;
}

// Create context with default values
const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  enableDemoMode: () => {},
  disableDemoMode: () => {},
  usingMockData: false,
  setUsingMockData: () => {},
});

/**
 * Demo Mode Provider
 * 
 * Provides context for tracking and managing demo mode across the application.
 * Demo mode indicates that the application is using mock data for demonstration
 * purposes rather than real backend data.
 * 
 * Routes that start with /demo/ automatically enable demo mode.
 */
export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const pathname = usePathname();

  // Auto-enable demo mode for routes that start with /demo/
  useEffect(() => {
    if (pathname?.startsWith('/demo/')) {
      setIsDemoMode(true);
      setUsingMockData(true);
      console.log('[DemoMode] Automatically enabled demo mode for demo route:', pathname);
    }
  }, [pathname]);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    console.log('[DemoMode] Demo mode manually enabled');
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    setUsingMockData(false);
    console.log('[DemoMode] Demo mode disabled');
  };

  return (
    <DemoModeContext.Provider 
      value={{ 
        isDemoMode, 
        enableDemoMode, 
        disableDemoMode, 
        usingMockData, 
        setUsingMockData 
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

/**
 * Custom hook to access the demo mode context
 * @returns The demo mode context value
 */
export function useDemoMode() {
  const context = useContext(DemoModeContext);
  
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  
  return context;
} 