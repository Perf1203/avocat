
"use client";

import { useState, useCallback, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import { useFirebase, useDoc, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signInAnonymously, User } from 'firebase/auth';
import { ChatDrawer } from './chat-drawer';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function ChatWidget() {
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);
  const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
  const isUserAdmin = adminRole?.isAdmin === true;

  useEffect(() => {
    const storedId = localStorage.getItem('conversationId');
    if (storedId) {
      setConversationId(storedId);
    }
  }, []);

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'admin_settings', 'schedule') : null),
    [firestore]
  );
  const { data: settings, isLoading: isLoadingSettings } = useDoc(settingsRef);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, isLoading: isLoadingConversation } = useDoc(conversationRef);
  const isBlocked = conversation?.isBlocked === true;

  const openChat = useCallback((currentUser: User | null) => {
    if (!settings || !currentUser) return;

    if (settings.chatType === 'whatsapp') {
      const phone = settings.whatsAppNumber || '';
      const message = encodeURIComponent("Bună, aș dori să programez o consultație.");
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      setIsOpen(true);
    }
  }, [settings]);

  const handleToggle = useCallback(async () => {
    if (user) {
      openChat(user);
    } else if (!isUserLoading && !isAuthInProgress) {
      setIsAuthInProgress(true);
      try {
        const userCredential = await signInAnonymously(auth);
        openChat(userCredential.user);
      } catch (error) {
        console.error("Anonymous sign-in failed", error);
      } finally {
        setIsAuthInProgress(false);
      }
    }
  }, [user, isUserLoading, isAuthInProgress, auth, openChat]);

  const getIcon = () => {
    if (isAuthInProgress || isUserLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
    if (isOpen) return <X className="h-6 w-6" />;
    return <MessageSquare className="h-6 w-6" />;
  };

  if (isLoadingSettings || !settings?.isChatEnabled || isBlocked || isLoadingConversation || isUserAdmin) {
    return null;
  }

  const isInternalChatOpen = settings.chatType === 'internal' && isOpen;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={isInternalChatOpen ? () => setIsOpen(false) : handleToggle}
          size="icon"
          className={cn(
            "rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-110",
            isInternalChatOpen && "bg-destructive hover:bg-destructive/90"
          )}
          disabled={isAuthInProgress}
        >
          {getIcon()}
          <span className="sr-only">{isInternalChatOpen ? "Închide Chat" : "Deschide Chat"}</span>
        </Button>
      </div>
      {settings.chatType === 'internal' && <ChatDrawer isOpen={isInternalChatOpen} onOpenChange={setIsOpen} />}
    </>
  );
}
