import React from 'react';
import { useDocumentStore } from '@/store/zustand';
import { SectionRevision, RiskLevel } from '@/types';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  RotateCw,
  Calendar,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Risk level badge colors
const riskLevelColors: Record<RiskLevel, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200'
};

// Default risk level color for fallback
const defaultRiskColor = 'bg-gray-100 text-gray-800 border-gray-200';

// Status badge colors
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

// Status icons
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'accepted':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

// Risk level icon
const RiskIcon = ({ level }: { level: RiskLevel }) => {
  switch (level) {
    case 'high':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'low':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
};

// Format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Revision Card Component
const RevisionCard = ({ 
  revision, 
  onAccept, 
  onReject 
}: { 
  revision: SectionRevision;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  const { highlightedSection, setHighlightedSection } = useDocumentStore();
  
  const handleSectionClick = () => {
    setHighlightedSection(revision.sectionId);
  };
  
  return (
    <Card className={`mb-4 border ${
      highlightedSection === revision.sectionId ? 'border-primary shadow-md' : 'border-border'
    }`}>
      <CardHeader className="py-4 px-4">
        <div className="flex justify-between items-center">
          <Badge 
            variant="outline" 
            className={`${statusColors[revision.status]} gap-1 items-center`}
          >
            <StatusIcon status={revision.status} />
            {revision.status.charAt(0).toUpperCase() + revision.status.slice(1)}
          </Badge>
          
          {revision.aiGenerated && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              AI Generated
            </Badge>
          )}
          
          {revision.riskLevel && (
            <Badge 
              variant="outline" 
              className={`${riskLevelColors[revision.riskLevel] || defaultRiskColor} gap-1 items-center`}
            >
              <RiskIcon level={revision.riskLevel} />
              {revision.riskLevel.charAt(0).toUpperCase() + revision.riskLevel.slice(1)} Risk
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(new Date(revision.createdAt))}</span>
        </div>
      </CardHeader>
      
      <CardContent className="py-2 px-4">
        {revision.comment && (
          <div className="mb-3 text-sm border-l-2 border-gray-200 pl-3 py-1 italic text-muted-foreground">
            {revision.comment}
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="text-xs w-full justify-start gap-2 mb-2"
          onClick={handleSectionClick}
        >
          <FileText className="h-3 w-3" />
          View in document
        </Button>
      </CardContent>
      
      {revision.status === 'pending' && (
        <CardFooter className="flex justify-between px-4 py-3 gap-2">
          <Button 
            variant="outline" 
            className="w-1/2" 
            size="sm"
            onClick={() => onReject(revision.id || revision.sectionId)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button 
            className="w-1/2" 
            size="sm"
            onClick={() => onAccept(revision.id || revision.sectionId)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Empty state component
const EmptyState = ({ type }: { type: 'revisions' | 'history' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="bg-muted rounded-full p-3 mb-3">
      {type === 'revisions' ? (
        <FileText className="h-6 w-6 text-muted-foreground" />
      ) : (
        <RotateCw className="h-6 w-6 text-muted-foreground" />
      )}
    </div>
    <h3 className="text-lg font-medium">No {type} found</h3>
    <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
      {type === 'revisions'
        ? "There are no pending revisions for this document."
        : "The revision history for this document is empty."}
    </p>
  </div>
);

// Main DocRevisionSidebar component
const DocRevisionSidebar: React.FC = () => {
  const { 
    currentDocument,
    pendingRevisions,
    revisions,
    acceptRevision,
    rejectRevision
  } = useDocumentStore();
  
  // Filter revisions with valid status
  const pendingRevs = pendingRevisions.filter(r => r.status === 'pending');
  const historyRevs = revisions.filter(r => r.status === 'accepted' || r.status === 'rejected');
  
  // Sort revisions by date (newest first)
  const sortedPending = [...pendingRevs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const sortedHistory = [...historyRevs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!currentDocument) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">No document loaded</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Document Revisions</h3>
        <p className="text-sm text-muted-foreground">
          Review and manage document changes
        </p>
      </div>
      
      <Tabs defaultValue="pending" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1 relative">
              Pending
              {pendingRevs.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {pendingRevs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="pending" className="flex-1 p-0 m-0">
          <ScrollArea className="h-[calc(100vh-220px)] p-4">
            {sortedPending.length > 0 ? (
              sortedPending.map(revision => (
                <RevisionCard 
                  key={revision.id || `${revision.sectionId}-${revision.createdAt.toString()}`}
                  revision={revision}
                  onAccept={acceptRevision}
                  onReject={rejectRevision}
                />
              ))
            ) : (
              <EmptyState type="revisions" />
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="history" className="flex-1 p-0 m-0">
          <ScrollArea className="h-[calc(100vh-220px)] p-4">
            {sortedHistory.length > 0 ? (
              sortedHistory.map(revision => (
                <RevisionCard 
                  key={revision.id || `${revision.sectionId}-${revision.createdAt.toString()}`}
                  revision={revision}
                  onAccept={acceptRevision}
                  onReject={rejectRevision}
                />
              ))
            ) : (
              <EmptyState type="history" />
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocRevisionSidebar; 