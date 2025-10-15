import { Scale } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Scale className="h-8 w-8 text-primary" />
      <span className="text-xl font-headline font-bold text-primary">
        Avocat Law
      </span>
    </div>
  );
}
