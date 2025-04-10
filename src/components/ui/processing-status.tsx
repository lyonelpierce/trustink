import React from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ProcessingStatus } from '@/types/document';

interface ProcessingStatusProps {
  status: ProcessingStatus;
  className?: string;
  onRetry?: () => void;
}

export function ProcessingStatusIndicator({
  status,
  className = '',
  onRetry
}: ProcessingStatusProps) {
  const getStatusColor = () => {
    switch (status.status) {
      case 'processing':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getProgressBar = () => {
    if (status.status !== 'processing' || !status.progress) return null;

    return (
      <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${status.progress}%` }}
        />
      </div>
    );
  };

  const getStageDetails = () => {
    if (!status.details) return null;

    const { stage, currentPage, totalPages, processedSections, totalSections } = status.details;

    switch (stage) {
      case 'extraction':
        return currentPage && totalPages ? (
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
        ) : null;
      case 'embedding':
        return processedSections && totalSections ? (
          <span className="text-sm text-gray-500">
            Processing section {processedSections} of {totalSections}
          </span>
        ) : null;
      case 'indexing':
        return <span className="text-sm text-gray-500">Saving to database...</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className={getStatusColor()}>{getStatusIcon()}</span>
        <span className="font-medium">{status.message || 'Processing...'}</span>
      </div>

      {getProgressBar()}
      {getStageDetails()}

      {status.error && (
        <div className="mt-2 text-center">
          <p className="text-red-500 text-sm">{status.error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
} 