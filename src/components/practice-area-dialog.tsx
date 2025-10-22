
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Gavel, BookOpen, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type PracticeAreaFormData = z.infer<typeof PracticeAreaSchema>;

interface PracticeAreaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  area: { title: string; description: string; icon?: string; id?: string } | null;
  onSave: (data: PracticeAreaFormData) => void;
}

const availableIcons = [
    { name: 'Gavel', Icon: Gavel, label: 'Martillo' },
    { name: 'BookOpen', Icon: BookOpen, label: 'Libro' },
    { name: 'PenSquare', Icon: PenSquare, label: 'Lápiz' },
];

export function PracticeAreaDialog({ isOpen, onOpenChange, area, onSave }: PracticeAreaDialogProps) {
  const form = useForm<PracticeAreaFormData>({
    resolver: zodResolver(PracticeAreaSchema),
    defaultValues: {
      icon: 'Gavel',
    }
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = form;

  const selectedIcon = watch('icon');

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
            <RadioGroup
                onValueChange={(value) => setValue('icon', value)}
                value={selectedIcon}
                className="grid grid-cols-3 gap-4"
            >
                {availableIcons.map(({ name, Icon }) => (
                     <Label key={name} htmlFor={name} className={cn(
                        "flex flex-col items-center justify-center gap-2 border rounded-md p-4 cursor-pointer",
                        "hover:bg-accent hover:text-accent-foreground",
                        selectedIcon === name && "bg-primary text-primary-foreground border-primary"
                     )}>
                        <RadioGroupItem value={name} id={name} className="sr-only" />
                        <Icon className="h-8 w-8" />
                    </Label>
                ))}
            </RadioGroup>
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

  