'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface LoomEmbedProps {
  id: string;
}

export default function LoomEmbed({ id }: LoomEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <div className="aspect-video">
          <iframe
            src={`https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`}
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 