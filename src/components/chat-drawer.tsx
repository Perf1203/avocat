
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, LogOut, User as UserIcon, Mail, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useFirebase, useUser, useAuth, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';

interface ChatDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChatDrawer({ isOpen, onOpenChange }: ChatDrawerProps) {
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Identification state
  const [showIdentification, setShowIdentification] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    const storedConversationId = localStorage.getItem('conversationId');
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }
  }, []);
  
  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation } = useDoc(conversationRef);

  useEffect(() => {
    if (conversation?.identificationRequested) {
        setShowIdentification(true);
    }
  }, [conversation]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(collection(firestore, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, conversationId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        if(scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, showIdentification]);
  
  const handleLeaveChat = async () => {
    if (!auth) return;
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
          await signOut(auth);
      }
      localStorage.removeItem('conversationId');
      setConversationId(null);
      setGuestName('');
      setGuestEmail('');
      setShowIdentification(false);
      onOpenChange(false);
       toast({
        title: 'Chat încheiat',
        description: 'Ați părăsit conversația.',
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: 'Nu am putut încheia sesiunea de chat.',
      });
    }
  };
  
  const handleStartConversation = async () => {
      if (!firestore || !user) return;
      
      const newConversationRef = doc(collection(firestore, 'conversations'));
      const newConvoData = {
            guestId: user.uid,
            adminId: 'default-admin-id',
            createdAt: serverTimestamp(),
            lastMessageAt: serverTimestamp(),
            lastMessageText: message || 'Conversație nouă începută',
            isReadByAdmin: false,
            guestName: '',
            guestEmail: '',
            identificationRequested: false,
        };
        await setDoc(newConversationRef, newConvoData);
        const newConversationId = newConversationRef.id;
        setConversationId(newConversationId);
        localStorage.setItem('conversationId', newConversationId);
        return newConversationId;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !message.trim()) return;

    let currentConversationId = conversationId;

    if (!currentConversationId) {
        currentConversationId = await handleStartConversation();
        if (!currentConversationId) return;
    }

    const messagesCol = collection(firestore, 'conversations', currentConversationId, 'messages');
    await addDoc(messagesCol, {
      text: message,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    
    const convoRef = doc(firestore, 'conversations', currentConversationId);
    await setDoc(convoRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageText: message,
        isReadByAdmin: false,
    }, { merge: true });

    setMessage('');
  };

  const handleSaveIdentification = () => {
    if (!conversationRef) return;
    
    const identificationData: { guestName?: string; guestEmail?: string, identificationRequested?: boolean } = {};
    if (guestName) identificationData.guestName = guestName;
    if (guestEmail) identificationData.guestEmail = guestEmail;
    identificationData.identificationRequested = false; // Reset request flag

    updateDocumentNonBlocking(conversationRef, identificationData);
    
    toast({
        title: 'Informații salvate',
        description: 'Numele și emailul dvs. au fost salvate.'
    });
    setShowIdentification(false);
  }

  const renderIdentificationForm = () => (
    <div className="p-4 space-y-4 border-b">
        <h3 className="font-semibold text-center text-sm text-muted-foreground">Identificare Opțională</h3>
        <div className="space-y-2">
            <Label htmlFor="guest-name">Nume</Label>
            <div className="relative">
                <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="guest-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Numele dvs..." className="pl-8" />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="guest-email">Email</Label>
            <div className="relative">
                 <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="guest-email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="email@exemplu.com" className="pl-8" />
            </div>
        </div>
        <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowIdentification(false)}>Anulează</Button>
            <Button onClick={handleSaveIdentification}>Salvează</Button>
        </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0">
        <SheetHeader className="p-4 border-b flex-row justify-between items-center">
          <div>
            <SheetTitle>Contactați-ne</SheetTitle>
            <SheetDescription>Lăsați-ne un mesaj și vă vom răspunde în curând.</SheetDescription>
          </div>
           <Button variant="ghost" size="sm" onClick={handleLeaveChat}>
             <LogOut className="mr-2 h-4 w-4"/>
             Părăsiți
           </Button>
        </SheetHeader>
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
             { !conversation?.guestName && !showIdentification && (
                <div className="p-2 text-center">
                    <Button variant="link" size="sm" onClick={() => setShowIdentification(true)}>
                        <Info className="mr-2 h-4 w-4" />
                        Mă identific
                    </Button>
                </div>
            )}
            { showIdentification && renderIdentificationForm() }
            <div className="p-4 space-y-4">
            {messages && messages.map((msg: any) => (
                <div
                    key={msg.id}
                    className={cn(
                    'flex items-end gap-2',
                    msg.senderId === user?.uid ? 'justify-end' : 'justify-start'
                    )}
                >
                    {msg.senderId !== user?.uid && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                    className={cn(
                        'max-w-xs rounded-lg px-3 py-2 text-sm',
                        msg.senderId === user?.uid
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                    >
                    {msg.text}
                    </div>
                </div>
                ))}
            </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrieți mesajul..."
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!message.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Trimite</span>
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

    