
'use client';

import { useEffect, useState } from 'react';
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
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

type PracticeAreaFormData = z.infer<typeof PracticeAreaSchema>;

interface PracticeAreaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  area: PracticeAreaFormData & { id?: string } | null;
  onSave: (data: PracticeAreaFormData) => void;
}

const iconMap: { [key: string]: LucideIcons.LucideIcon } = LucideIcons;
const iconList = Object.keys(iconMap).filter(key => key.match(/^[A-Z]/)); // Filter for component names

export function PracticeAreaDialog({ isOpen, onOpenChange, area, onSave }: PracticeAreaDialogProps) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PracticeAreaFormData>({
    resolver: zodResolver(PracticeAreaSchema),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const selectedIconName = watch('icon');

  const filteredIcons = searchTerm
    ? iconList.filter(iconName => iconName.toLowerCase().includes(searchTerm.toLowerCase()))
    : iconList;

  const SelectedIcon = selectedIconName ? iconMap[selectedIconName] : null;

  useEffect(() => {
    if (area) {
      reset(area);
    } else {
      reset({
        icon: 'Gavel',
        title: '',
        description: '',
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
            <Label>Icon</Label>
            <div className="flex items-center gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Caută icon (ex: Shield, Briefcase)..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                 <div className="flex items-center justify-center gap-2 border rounded-md p-2 w-48">
                    {SelectedIcon ? <SelectedIcon /> : null}
                    <span className="font-mono text-sm">{selectedIconName}</span>
                 </div>
            </div>
             <ScrollArea className="h-48 mt-2 border rounded-md p-2">
                <div className="grid grid-cols-5 gap-1">
                    {filteredIcons.map(iconName => {
                        const IconComponent = iconMap[iconName];
                        return (
                            <Button 
                                key={iconName}
                                type="button"
                                variant={selectedIconName === iconName ? "secondary" : "ghost"}
                                onClick={() => {
                                    setValue('icon', iconName);
                                    setSearchTerm('');
                                }}
                                className="flex flex-col items-center justify-center h-16 gap-1"
                            >
                                <IconComponent className="h-5 w-5"/>
                                <span className="text-xs truncate w-full px-1">{iconName}</span>
                            </Button>
                        )
                    })}
                </div>
             </ScrollArea>
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
