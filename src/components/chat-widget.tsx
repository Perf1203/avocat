

"use client";

import { useState, useCallback, useEffect } from 'react';
import { MessageSquare, X, Info } from 'lucide-react';
import { Button } from './ui/button';
import { useFirebase, useDoc, useMemoFirebase, useAuth, useUser, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { signInAnonymously, User } from 'firebase/auth';
import { ChatDrawer } from './chat-drawer';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import Link from 'next/link';

export function ChatWidget() {
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showOccupiedMessage, setShowOccupiedMessage] = useState(false);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
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
  
  const adminStatusCollectionRef = useMemoFirebase(() => {
    return firestore ? collection(firestore, 'admin_status') : null;
  }, [firestore]);

  const { data: availableAdmins, isLoading: isLoadingAdmins } = useCollection(adminStatusCollectionRef);

  const handleToggle = useCallback(async () => {
    // If the occupied message is showing, this button just closes it.
    if (showOccupiedMessage) {
      setShowOccupiedMessage(false);
      return;
    }
    
    // Check admin status before proceeding
    const isAnyAdminAvailable = availableAdmins?.some(admin => (admin as any).status === 'available');
    const isAnyAdminOccupied = availableAdmins?.some(admin => (admin as any).status === 'occupied');

    if (settings?.showChatOnlyIfAdminIsAvailable && !isAnyAdminAvailable && isAnyAdminOccupied) {
        setShowOccupiedMessage(true);
        return;
    }


    if (user) {
      if (settings?.chatType === 'whatsapp') {
        const phone = settings.whatsAppNumber || '';
        const message = encodeURIComponent("Bună, aș dori să programez o consultație.");
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      } else {
        setIsDrawerOpen(true);
      }
    } else if (!isUserLoading && !isAuthInProgress) {
      setIsAuthInProgress(true);
      try {
        await signInAnonymously(auth);
        // After anonymous sign-in, user state will update, and this logic will re-run.
        // We will open the drawer on the next click, once user is available.
      } catch (error) {
        console.error("Anonymous sign-in failed", error);
      } finally {
        setIsAuthInProgress(false);
      }
    }
  }, [user, isUserLoading, isAuthInProgress, auth, settings, availableAdmins, showOccupiedMessage]);

  const getIcon = () => {
    if (isAuthInProgress || isUserLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
    if (isDrawerOpen || showOccupiedMessage) return <X className="h-6 w-6" />;
    return <MessageSquare className="h-6 w-6" />;
  };

  const shouldShowWidget = () => {
    if (isUserAdmin || isLoadingSettings || !settings?.isChatEnabled || isBlocked || isLoadingConversation || isLoadingAdmins) {
      return false;
    }
    
    if (settings.showChatOnlyIfAdminIsAvailable) {
        return availableAdmins ? availableAdmins.length > 0 : false;
    }
    
    return true;
  };

  if (!shouldShowWidget()) {
    return null;
  }

  const isInternalChatOpen = settings.chatType === 'internal' && isDrawerOpen;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {showOccupiedMessage && (
            <Card className="mb-2 w-72 shadow-xl animate-in fade-in-50 slide-in-from-bottom-5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="text-amber-500"/> Notificare</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Administratorul este ocupat momentan. Vă rugăm să programați o întâlnire sau să reveniți mai târziu.</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button variant="ghost" onClick={() => setShowOccupiedMessage(false)}>Închide</Button>
                    <Button asChild>
                        <Link href="/schedule">Programează</Link>
                    </Button>
                </CardFooter>
            </Card>
        )}
        <div className="flex justify-end">
            <Button
            onClick={handleToggle}
            size="icon"
            className={cn(
                "rounded-full h-14 w-14 shadow-lg transition-transform hover:scale-110",
                (isInternalChatOpen || showOccupiedMessage) && "bg-destructive hover:bg-destructive/90"
            )}
            disabled={isAuthInProgress}
            >
            {getIcon()}
            <span className="sr-only">{isInternalChatOpen ? "Închide Chat" : "Deschide Chat"}</span>
            </Button>
        </div>
      </div>
      {settings.chatType === 'internal' && <ChatDrawer isOpen={isInternalChatOpen} onOpenChange={setIsDrawerOpen} />}
    </>
  );
}

    