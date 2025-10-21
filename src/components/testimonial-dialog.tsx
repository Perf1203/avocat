
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TestimonialSchema } from '@/lib/schemas';
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

type TestimonialFormData = z.infer<typeof TestimonialSchema>;

interface TestimonialDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  testimonial: TestimonialFormData & { id?: string } | null;
  onSave: (data: TestimonialFormData) => void;
}

export function TestimonialDialog({ isOpen, onOpenChange, testimonial, onSave }: TestimonialDialogProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TestimonialFormData>({
    resolver: zodResolver(TestimonialSchema),
  });

  useEffect(() => {
    if (testimonial) {
      reset(testimonial);
    } else {
      reset({
        quote: '',
        author: '',
        title: '',
        avatarUrl: '',
      });
    }
  }, [testimonial, isOpen, reset]);

  const onSubmit = (data: TestimonialFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{testimonial ? 'Editează Testimonial' : 'Adaugă Testimonial Nou'}</DialogTitle>
          <DialogDescription>
            Completați detaliile de mai jos pentru testimonial.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quote">Citat</Label>
            <Textarea id="quote" {...register('quote')} rows={4} />
            {errors.quote && <p className="text-sm text-destructive">{errors.quote.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Autor</Label>
            <Input id="author" {...register('author')} />
            {errors.author && <p className="text-sm text-destructive">{errors.author.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Titlu/Companie Autor</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">URL Avatar</Label>
            <Input id="avatarUrl" {...register('avatarUrl')} />
            {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>}
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
