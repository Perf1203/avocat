
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
import { Gavel, BookOpen, PenSquare, Scale, Landmark, Shield, Briefcase, FileText, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PracticeAreaFormData = z.infer<typeof PracticeAreaSchema>;

interface PracticeAreaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  area: { title: string; description: string; icon?: string; id?: string } | null;
  onSave: (data: PracticeAreaFormData) => void;
}

const availableIcons: { name: string; label: string; Icon: LucideIcon }[] = [
    { name: 'Gavel', Icon: Gavel, label: 'Ciocan (Justiție)' },
    { name: 'BookOpen', Icon: BookOpen, label: 'Carte (Cunoaștere)' },
    { name: 'PenSquare', Icon: PenSquare, label: 'Stilou (Contracte)' },
    { name: 'Scale', Icon: Scale, label: 'Balanță (Echilibru)' },
    { name: 'Landmark', Icon: Landmark, label: 'Tribunal (Drept Public)' },
    { name: 'Shield', Icon: Shield, label: 'Scut (Protecție)' },
    { name: 'Briefcase', Icon: Briefcase, label: 'Servietă (Drept Corporativ)' },
    { name: 'FileText', Icon: FileText, label: 'Document (Litigii)' },
];

export function PracticeAreaDialog({ isOpen, onOpenChange, area, onSave }: PracticeAreaDialogProps) {
  const form = useForm<PracticeAreaFormData>({
    resolver: zodResolver(PracticeAreaSchema),
    defaultValues: {
      icon: 'Gavel',
    }
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = form;

  useEffect(() => {
    if (area) {
      reset(area);
    } else {
      reset({
        title: '',
        description: '',
        icon: 'Gavel',
      });
    }
  }, [area, isOpen, reset]);

  const onSubmit = (data: PracticeAreaFormData) => {
    onSave(data);
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
          
           <div className="space-y-2">
            <Label>Selectează Icon</Label>
            <Select onValueChange={(value) => setValue('icon', value)} defaultValue={area?.icon || 'Gavel'}>
                <SelectTrigger>
                    <SelectValue placeholder="Selectează un icon..." />
                </SelectTrigger>
                <SelectContent>
                    {availableIcons.map(({ name, label, Icon }) => (
                        <SelectItem key={name} value={name}>
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
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

  
