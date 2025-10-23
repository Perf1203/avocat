
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, LogOut, User as UserIcon, Mail, Info, CreditCard, CheckCircle, FileDown } from 'lucide-react';
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
import { toDataURL } from 'qrcode';
import Image from 'next/image';
import Link from 'next/link';
import { generateBill } from '@/lib/generate-bill';


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
  
  const [qrCode, setQrCode] = useState<string | null>(null);

    const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'admin_settings', 'schedule');
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);
  const websiteName = settings?.websiteName || "Avocat Law";

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
    // Admin requests identification and user has not identified yet.
    if (conversation?.identificationRequested && !conversation?.guestName) {
        setShowIdentification(true);
    }
    // If user has already provided a name, don't show the identification form.
    if (conversation?.guestName) {
        setShowIdentification(false);
    }
    if (conversation?.paymentLink && conversation?.paymentStatus === 'pending') {
      toDataURL(conversation.paymentLink, { width: 200 })
        .then(url => setQrCode(url))
        .catch(err => console.error(err));
    } else {
        setQrCode(null);
    }
  }, [conversation]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(collection(firestore, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, conversationId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
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
            // Reminder is set by the admin on first reply
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
    
    // Require at least a name to proceed if identification was requested by admin
    if (conversation?.identificationRequested && !guestName.trim()) {
        toast({
            variant: 'destructive',
            title: 'Nume Obligatoriu',
            description: 'Vă rugăm să introduceți un nume pentru a continua.'
        });
        return;
    }

    const identificationData: { guestName?: string; guestEmail?: string, identificationRequested?: boolean } = {};
    if (guestName) identificationData.guestName = guestName;
    if (guestEmail) identificationData.guestEmail = guestEmail;
    // Don't reset request flag if user initiates identification
    if (conversation?.identificationRequested) {
        identificationData.identificationRequested = false;
    }

    updateDocumentNonBlocking(conversationRef, identificationData);
    
    toast({
        title: 'Informații salvate',
        description: 'Numele și emailul dvs. au fost salvate.'
    });
    setShowIdentification(false);
  }

  const handleDownloadBill = () => {
    if (!conversation) {
        toast({ variant: 'destructive', title: 'Eroare', description: 'Datele conversației nu sunt disponibile.' });
        return;
    }
    generateBill(conversation, websiteName);
  };


  const renderIdentificationForm = () => (
    <div className="p-4 space-y-4 border-b">
        <h3 className="font-semibold text-center text-sm text-muted-foreground">
            {conversation?.identificationRequested ? 'Administratorul solicită identificarea' : 'Identificare Opțională'}
        </h3>
        <div className="space-y-2">
            <Label htmlFor="guest-name">Nume {conversation?.identificationRequested && '*'}</Label>
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
            {!(conversation?.identificationRequested && !conversation?.guestName) && (
                <Button variant="ghost" onClick={() => setShowIdentification(false)}>Anulează</Button>
            )}
            <Button onClick={handleSaveIdentification}>Salvează</Button>
        </div>
    </div>
  );
  
  const isChatting = messages && messages.length > 0;
  const isMandatoryIdentification = conversation?.identificationRequested && !conversation?.guestName;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
        // Prevent closing the sheet if identification is mandatory
        if(isMandatoryIdentification) {
            onOpenChange(true);
        } else {
            onOpenChange(open);
        }
    }}>
      <SheetContent className="flex flex-col p-0">
        <SheetHeader className="p-4 border-b flex-row justify-between items-center">
          <div>
            <SheetTitle>Contactați-ne</SheetTitle>
            <SheetDescription>Lăsați-ne un mesaj și vă vom răspunde în curând.</SheetDescription>
          </div>
           <Button variant="ghost" size="sm" onClick={handleLeaveChat} disabled={isMandatoryIdentification}>
             <LogOut className="mr-2 h-4 w-4"/>
             Părăsiți
           </Button>
        </SheetHeader>
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
             { !conversation?.guestName && !showIdentification && !isChatting && (
                <div className="p-4 border-b text-center text-sm text-muted-foreground bg-secondary/30">
                    <p className="mb-2">Sunteți conectat ca vizitator anonim. Conversația se va pierde dacă ștergeți datele de navigare.</p>
                     <Button variant="link" size="sm" onClick={() => setShowIdentification(true)}>
                        <Info className="mr-2 h-4 w-4" />
                        Opțional, vă puteți identifica
                    </Button>
                </div>
            )}
            { showIdentification && renderIdentificationForm() }
            <div className="p-4 space-y-4">
            {messages && messages.map((msg: any) => {
                 if (msg.isSystemMessage) {
                    if (msg.systemMessageType === 'payment_request' && msg.paymentLink) {
                        if (conversation?.paymentStatus === 'paid') {
                            return (
                                <div key={msg.id} className="p-4 my-2 rounded-lg border bg-green-100 dark:bg-green-900/50 text-center">
                                    <h4 className="font-semibold flex items-center justify-center gap-2 mb-3"><CheckCircle className="text-green-600"/> Plată Confirmată</h4>
                                    <p className="text-sm text-muted-foreground mb-3">Plata a fost procesată cu succes. Puteți descărca factura.</p>
                                    <Button size="sm" variant="secondary" onClick={handleDownloadBill}>
                                        <FileDown className="mr-2 h-4 w-4"/> Descarcă Factura
                                    </Button>
                                </div>
                            )
                        }
                        return (
                             <div key={msg.id} className="p-4 my-2 rounded-lg border bg-secondary/50 text-center">
                                <h4 className="font-semibold flex items-center justify-center gap-2 mb-3"><CreditCard /> Solicitare de Plată</h4>
                                {qrCode && (
                                    <div className="my-4 flex justify-center">
                                        <Image src={qrCode} alt="QR Code Plată" width={150} height={150} />
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mb-3">Scanați codul QR sau folosiți linkul de mai jos.</p>
                                <Button asChild size="sm">
                                    <Link href={msg.paymentLink} target="_blank">Mergi la Plată</Link>
                                </Button>
                             </div>
                        );
                    }
                     if (msg.systemMessageType === 'payment_confirmed') {
                        return (
                            <div key={msg.id} className="text-center text-xs text-muted-foreground my-4 p-2 bg-green-100 dark:bg-green-900/50 rounded-md">
                                --- {msg.text} ---
                            </div>
                        )
                    }
                    return (
                        <div key={msg.id} className="text-center text-xs text-muted-foreground my-4">
                            --- {msg.text} ---
                        </div>
                    )
                }
                return (
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
                )
                })}
            </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrieți mesajul..."
              autoComplete="off"
              disabled={showIdentification}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || showIdentification}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Trimite</span>
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
