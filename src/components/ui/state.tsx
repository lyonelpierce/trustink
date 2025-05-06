"use client";

import React from 'react';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for state components
 */
interface StateComponentProps {
  /**
   * Title text to display
   */
  title: string;

  /**
   * Optional description for additional context
   */
  description?: string;

  /**
   * Optional additional class names
   */
  className?: string;

  /**
   * Whether to use a compact layout
   */
  compact?: boolean;

  /**
   * Optional action button
   */
  action?: React.ReactNode;

  /**
   * Optional icon override
   */
  icon?: React.ReactNode;
}

/**
 * Base state component that renders a consistent layout for
 * different states (loading, error, empty)
 */
const StateComponent: React.FC<StateComponentProps> = ({
  title,
  description,
  className,
  compact = false,
  action,
  icon
}) => {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 rounded-md',
        compact ? 'py-4' : 'py-10',
        className
      )}
    >
      <div className="mb-4">{icon}</div>
      <h3 className={cn('font-medium', compact ? 'text-base' : 'text-lg')}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-muted-foreground mt-1', compact ? 'text-sm' : 'text-base')}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

/**
 * Loading state component to indicate content is being loaded
 */
export function LoadingState({
  title = 'Loading',
  description,
  className,
  compact = false,
  iconSize
}: Omit<StateComponentProps, 'icon'> & { title?: string; iconSize?: number }) {
  const size = iconSize || (compact ? 20 : 32);
  
  return (
    <StateComponent
      title={title}
      description={description}
      className={className}
      compact={compact}
      icon={<Loader2 className={cn('animate-spin')} width={size} height={size} />}
    />
  );
}

/**
 * Error state component to show when something went wrong
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  className,
  compact = false,
  action,
  iconSize
}: Omit<StateComponentProps, 'icon'> & { title?: string; iconSize?: number }) {
  const size = iconSize || (compact ? 20 : 32);
  
  return (
    <StateComponent
      title={title}
      description={description}
      className={cn('border-red-100 bg-red-50', className)}
      compact={compact}
      action={action}
      icon={<AlertTriangle className={cn('text-red-500')} width={size} height={size} />}
    />
  );
}

/**
 * Empty state component for when there is no content to display
 */
export function EmptyState({
  title = 'No items found',
  description,
  className,
  compact = false,
  action,
  iconSize
}: Omit<StateComponentProps, 'icon'> & { title?: string; iconSize?: number }) {
  const size = iconSize || (compact ? 20 : 32);
  
  return (
    <StateComponent
      title={title}
      description={description}
      className={cn('border-gray-100 bg-gray-50', className)}
      compact={compact}
      action={action}
      icon={<Info className={cn('text-gray-400')} width={size} height={size} />}
    />
  );
} 