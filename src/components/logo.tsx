
'use client';
import { Scale } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function Logo() {
  const { firestore } = useFirebase();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'admin_settings', 'schedule');
  }, [firestore]);
  
  const { data: settings } = useDoc(settingsRef);
  const websiteName = settings?.websiteName || "Avocat Law";

  return (
    <div className="flex items-center gap-2">
      <Scale className="h-8 w-8 text-primary" />
      <span className="text-xl font-headline font-bold text-primary">
        {websiteName}
      </span>
    </div>
  );
}
