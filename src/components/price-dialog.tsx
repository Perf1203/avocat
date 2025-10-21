
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PriceSchema } from '@/lib/schemas';
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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from '@/lib/utils';

type PriceFormData = z.infer<typeof PriceSchema>;

interface PriceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  price: PriceFormData & { id?: string } | null;
  onSave: (data: PriceFormData) => void;
}

export function PriceDialog({ isOpen, onOpenChange, price, onSave }: PriceDialogProps) {
  const form = useForm<PriceFormData>({
    resolver: zodResolver(PriceSchema),
  });

  const { register, handleSubmit, reset, watch, formState: { errors }, setValue } = form;

  const priceType = watch('type');

  useEffect(() => {
    if (isOpen) {
        if (price) {
          reset({
            ...price,
            flatRate: price.flatRate || undefined,
            pricePerHour: price.pricePerHour || undefined,
          });
        } else {
          reset({
            title: '',
            description: '',
            type: undefined,
            flatRate: undefined,
            pricePerHour: undefined,
          });
        }
    }
  }, [price, isOpen, reset]);

  const onSubmit = (data: PriceFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{price ? 'Editează Plan de Preț' : 'Adaugă Plan de Preț Nou'}</DialogTitle>
          <DialogDescription>
            Completați detaliile de mai jos pentru planul de preț.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlu Plan</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descriere</Label>
            <Textarea id="description" {...register('description')} rows={3} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tip Preț</Label>
            <RadioGroup
                onValueChange={(value) => setValue('type', value as 'flat' | 'hourly')}
                value={priceType}
                className="flex gap-4"
            >
                <Label className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary cursor-pointer">
                    <RadioGroupItem value="flat" />
                    Taxă Unică (Flat)
                </Label>
                <Label className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary cursor-pointer">
                    <RadioGroupItem value="hourly" />
                    Orar (Hourly)
                </Label>
            </RadioGroup>
             {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

           <div className={cn("space-y-2", priceType === 'flat' ? 'block' : 'hidden')}>
            <Label htmlFor="flatRate">Valoare Taxă Unică (€)</Label>
            <Input id="flatRate" type="number" {...register('flatRate', { valueAsNumber: true })} />
            {errors.flatRate && <p className="text-sm text-destructive">{errors.flatRate.message}</p>}
          </div>

          <div className={cn("space-y-2", priceType === 'hourly' ? 'block' : 'hidden')}>
            <Label htmlFor="pricePerHour">Valoare Taxă Orară (€/oră)</Label>
            <Input id="pricePerHour" type="number" {...register('pricePerHour', { valueAsNumber: true })} />
            {errors.pricePerHour && <p className="text-sm text-destructive">{errors.pricePerHour.message}</p>}
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
