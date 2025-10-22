
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PracticeAreaSchema } from '@/lib/schemas';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PracticeAreaFormData = z.infer<typeof PracticeAreaSchema>;

interface PracticeAreaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  area: { title: string; description: string; id?: string } | null;
  onSave: (data: PracticeAreaFormData) => void;
}

export function PracticeAreaDialog({ isOpen, onOpenChange, area, onSave }: PracticeAreaDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PracticeAreaFormData>({
    resolver: zodResolver(PracticeAreaSchema),
  });

  useEffect(() => {
    if (area) {
      reset(area);
    } else {
      reset({
        title: '',
        description: '',
      });
    }
  }, [area, isOpen, reset]);

  const onSubmit = (data: PracticeAreaFormData) => {
    onSave({ ...data, icon: 'Gavel' });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{area ? 'Editează Serviciu' : 'Adaugă Serviciu Nou'}</DialogTitle>
          <DialogDescription>
            Completați detaliile pentru aria de practică.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlu</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descriere</Label>
            <Textarea id="description" {...register('description')} rows={3} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit">Salvează</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
