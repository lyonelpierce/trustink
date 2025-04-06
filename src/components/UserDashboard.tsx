'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { FileText, Clock, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import ErrorBoundary from '@/components/ErrorBoundary';

interface UserDocument {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  size: number;
  type: string;
}

export function UserDashboard() {
  const { userId } = useAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserDocuments() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[UserDashboard] Fetching user documents');
        const response = await fetch('/api/documents');
        
        if (!response.ok) {
          console.error('[UserDashboard] Error fetching documents:', response.status);
          throw new Error(`Failed to fetch documents: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[UserDashboard] Fetched documents:', data.length);
        setDocuments(data);
      } catch (error) {
        console.error('[UserDashboard] Error:', error);
        setError('Failed to load your documents');
        toast.error('Failed to load your documents');
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchUserDocuments();
    }
  }, [userId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Your Documents</h1>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
            <p className="text-gray-500">Loading your documents...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">Upload your first document to get started</p>
            <Link 
              href="/upload" 
              className="inline-block px-4 py-2 bg-primary text-white rounded-md"
            >
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Link 
                href={`/documents/${doc.id}`} 
                key={doc.id}
                className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-2" />
                      <h3 className="font-medium truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    {formatFileSize(doc.size)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 