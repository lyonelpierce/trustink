'use client';

import { useEffect, useState } from 'react';
import { DocumentUploader } from '@/components/DocumentUploader';
import { toast } from 'sonner';
import { Loader2, File, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  name: string;
  created_at: string;
  type: string;
  size: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      
      try {
        const response = await fetch('/api/documents');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Failed to load documents');
        }
        
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading documents:', error);
        
        // Display a more user-friendly error message
        if (error instanceof Error) {
          toast.error(`Error: ${error.message}`);
        } else {
          toast.error('Unable to load your documents. Please try again later.');
        }
        
        // Set documents to empty array to avoid undefined errors
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadDocuments();
  }, []);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Documents</h1>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Upload a Document</h2>
        <DocumentUploader />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <p className="ml-2">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">
              You haven&apos;t uploaded any documents yet. Get started by uploading your first document.
            </p>
            <DocumentUploader />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Link 
                key={doc.id} 
                href={`/documents/${doc.id}`} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <File className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-lg truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(doc.created_at)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(doc.size)}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 