import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessingStatusIndicator } from '@/components/ui/processing-status';
import { ProcessingStatus } from '@/types/document';

describe('ProcessingStatusIndicator', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  it('displays processing state correctly', () => {
    const status: ProcessingStatus = {
      status: 'processing',
      message: 'Processing document...',
      progress: 45,
      details: {
        stage: 'extraction',
        currentPage: 2,
        totalPages: 5
      }
    };

    render(<ProcessingStatusIndicator status={status} />);

    expect(screen.getByText('Processing document...')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
  });

  it('displays embedding progress correctly', () => {
    const status: ProcessingStatus = {
      status: 'processing',
      message: 'Generating embeddings...',
      progress: 60,
      details: {
        stage: 'embedding',
        processedSections: 3,
        totalSections: 10
      }
    };

    render(<ProcessingStatusIndicator status={status} />);

    expect(screen.getByText('Generating embeddings...')).toBeInTheDocument();
    expect(screen.getByText('Processing section 3 of 10')).toBeInTheDocument();
  });

  it('displays error state with retry button', () => {
    const status: ProcessingStatus = {
      status: 'error',
      message: 'Failed to process document',
      error: 'Network error occurred'
    };

    render(<ProcessingStatusIndicator status={status} onRetry={mockOnRetry} />);

    expect(screen.getByText('Failed to process document')).toBeInTheDocument();
    expect(screen.getByText('Network error occurred')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('displays success state', () => {
    const status: ProcessingStatus = {
      status: 'success',
      message: 'Document processed successfully'
    };

    render(<ProcessingStatusIndicator status={status} />);

    expect(screen.getByText('Document processed successfully')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const status: ProcessingStatus = {
      status: 'processing',
      message: 'Processing...'
    };

    const { container } = render(
      <ProcessingStatusIndicator status={status} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
}); 