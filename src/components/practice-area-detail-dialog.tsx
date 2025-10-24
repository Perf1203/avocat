
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface PracticeAreaDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  area: { title: string; description: string; icon?: string } | null;
}

const AreaIcon = ({ name = 'Gavel' }: { name?: string }) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.Gavel;
    return <IconComponent className="h-6 w-6 text-primary" />;
};

export function PracticeAreaDetailDialog({ isOpen, onOpenChange, area }: PracticeAreaDetailDialogProps) {
  if (!area) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-headline text-2xl text-primary">
            <AreaIcon name={area.icon} />
            {area.title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <DialogDescription className="text-base text-foreground/80 py-4 break-words">
              {area.description}
            </DialogDescription>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Închide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
