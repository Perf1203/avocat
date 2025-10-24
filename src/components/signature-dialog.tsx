
'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface SignatureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signatureDataUrl: string) => void;
}

export function SignatureDialog({ isOpen, onOpenChange, onSave }: SignatureDialogProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { toast } = useToast();

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast({
        variant: 'destructive',
        title: 'Semnătură goală',
        description: 'Vă rugăm să desenați semnătura înainte de a salva.',
      });
      return;
    }
    const signatureDataUrl = sigCanvas.current?.toDataURL('image/png') || '';
    onSave(signatureDataUrl);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
        // Clear canvas when dialog opens
        setTimeout(() => sigCanvas.current?.clear(), 100);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Semnează Contractul</DialogTitle>
          <DialogDescription>
            Vă rugăm să desenați semnătura în caseta de mai jos.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted w-full aspect-video">
            <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'w-full h-full rounded-md' }}
            />
        </div>
        <DialogFooter className='sm:justify-between'>
          <Button type="button" variant="outline" onClick={clearSignature}>
            Limpezește
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button type="button" onClick={saveSignature}>
              Salvează și Semnează
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    