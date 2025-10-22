'use client';

import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { firestore } = useFirebase();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'admin_settings', 'schedule');
  }, [firestore]);
  
  const { data: settings } = useDoc(settingsRef);
  const websiteName = settings?.websiteName || "Avocat Law";

  return (
    <footer className="border-t bg-background">
      <div className="container flex h-16 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          © {currentYear} {websiteName}. Toate drepturile rezervate.
        </p>
      </div>
    </footer>
  );
}
