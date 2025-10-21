
"use client";

import { useState } from 'react';
import { MessageSquare, WhatsApp, X } from 'lucide-react';
import { Button } from './ui/button';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ChatDrawer } from './chat-drawer';
import { cn } from '@/lib/utils';
import { signInAnonymously } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';

export function ChatWidget() {
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'admin_settings', 'schedule') : null),
    [firestore]
  );
  const { data: settings, isLoading } = useDoc(settingsRef);

  if (isLoading || !settings?.isChatEnabled) {
    return null;
  }

  const handleToggle = async () => {
    if (!user && !isUserLoading) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Anonymous sign-in failed", error);
        return;
      }
    }
    
    if (settings.chatType === 'whatsapp') {
      const phone = settings.whatsAppNumber || '';
      const message = encodeURIComponent("Bună, aș dori să programez o consultație.");
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      setIsOpen(!isOpen);
    }
  };
  
  const getIcon = () => {
    if (isOpen) return <X className="h-6 w-6" />;
    if (settings.chatType === 'whatsapp') {
      // A custom WhatsApp icon would be better here. Using a placeholder.
      return <MessageSquare className="h-6 w-6" />;
    }
    return <MessageSquare className="h-6 w-6" />;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleToggle}
          size="icon"
          className={cn(
            "rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-110",
            isOpen && "bg-destructive hover:bg-destructive/90"
          )}
        >
          {getIcon()}
          <span className="sr-only">Deschide Chat</span>
        </Button>
      </div>
      {settings.chatType === 'internal' && <ChatDrawer isOpen={isOpen} onOpenChange={setIsOpen} />}
    </>
  );
}

    