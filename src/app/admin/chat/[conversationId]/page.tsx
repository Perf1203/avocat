
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { Send, ArrowLeft, CircleUserRound, UserPlus, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// CountdownTimer Component
const CountdownTimer = ({ targetDate, onExpire }: { targetDate: Date | null, onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('Timp expirat');
        onExpire();
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      let timerString = '';
      if (hours > 0) timerString += `${hours}h `;
      if (minutes > 0) timerString += `${minutes}m `;
      if (hours === 0) timerString += `${seconds}s`;

      setTimeLeft(timerString.trim());
    };

    const interval = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (!targetDate) return null;

  return (
    <span className={cn("text-xs font-mono flex items-center gap-1", timeLeft === 'Timp expirat' ? "text-destructive" : "text-amber-600")}>
        <Clock className="h-3 w-3" />
        {timeLeft}
    </span>
  );
};


export default function ChatConversationPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [timerExpired, setTimerExpired] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, isLoading: isLoadingConversation } = useDoc(conversationRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(collection(firestore, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, conversationId]);

  const { data: messages, isLoading: isLoadingMessages } = useCollection(messagesQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            if(scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [messages, timerExpired]);

  useEffect(() => {
    // Mark conversation as read by admin
    if (conversationRef && conversation && !conversation.isReadByAdmin) {
      updateDocumentNonBlocking(conversationRef, { isReadByAdmin: true });
    }
  }, [conversationRef, conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !message.trim() || !conversationId || !conversationRef) return;

    // Check if this is the admin's first message
    const isFirstAdminMessage = !messages?.some((msg: any) => msg.senderId === user.uid);
    
    if (isFirstAdminMessage) {
        const reminderDate = new Date();
        reminderDate.setMinutes(reminderDate.getMinutes() + 10);
        // Set the 10-minute reminder when admin first responds
        setDocumentNonBlocking(conversationRef, { reminderAt: reminderDate }, { merge: true });
    }

    const messagesCol = collection(firestore, 'conversations', conversationId, 'messages');
    addDocumentNonBlocking(messagesCol, {
      text: message,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    
    // Update last message on conversation
    updateDocumentNonBlocking(conversationRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageText: message,
    });

    setMessage('');
  };
  
  const handleRequestIdentification = () => {
    if (!conversationRef) return;
    updateDocumentNonBlocking(conversationRef, { identificationRequested: true });
    toast({
        title: 'Cerere trimisă',
        description: 'Cererea de identificare a fost trimisă vizitatorului.'
    });
  };

  const handleRequestPayment = () => {
    if (!conversationRef || !paymentLink.trim()) return;

    const paymentData = {
        paymentLink: paymentLink,
        paymentStatus: 'pending',
        paymentRequestedAt: serverTimestamp()
    };
    updateDocumentNonBlocking(conversationRef, paymentData);

    const messagesCol = collection(firestore, 'conversations', conversationId, 'messages');
    addDocumentNonBlocking(messagesCol, {
        text: `Solicitare de plată trimisă: ${paymentLink}`,
        senderId: user?.uid,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
        systemMessageType: 'payment_request',
        paymentLink: paymentLink
    });

    toast({
        title: 'Solicitare de plată trimisă',
        description: 'Linkul de plată a fost trimis vizitatorului.'
    });
    setShowPaymentDialog(false);
    setPaymentLink('');
  };

  const handleConfirmPayment = () => {
    if (!conversationRef || !user) return;
    const followUpDate = new Date();
    followUpDate.setMinutes(followUpDate.getMinutes() + 150); // 2.5 hours from now

    updateDocumentNonBlocking(conversationRef, { 
      paymentStatus: 'paid',
      followUpAt: followUpDate,
      reminderAt: null // Clear the initial reminder
    });

     const messagesCol = collection(firestore, 'conversations', conversationId, 'messages');
    addDocumentNonBlocking(messagesCol, {
        text: 'Plata a fost confirmată de către administrator.',
        senderId: user?.uid,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
        systemMessageType: 'payment_confirmed',
    });

    toast({
        title: 'Plată Confirmată',
        description: 'Ați marcat plata ca fiind finalizată.'
    });
  };

  if (isUserLoading || isLoadingConversation) {
    return <div className="container py-12"><Skeleton className="h-[70vh] w-full" /></div>;
  }

  const guestDisplayName = conversation?.guestName || 'Vizitator';
  const guestDisplayInfo = conversation?.guestEmail || (conversation?.guestId ? `${conversation.guestId.substring(0, 12)}...` : '');
  const isGuestAnonymous = !conversation?.guestName;

  const activeTimerDate = conversation?.followUpAt?.toDate() || conversation?.reminderAt?.toDate() || null;
  const isFollowUpTimer = !!conversation?.followUpAt;


  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader className="flex-row items-center justify-between border-b gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
                <Link href="/admin">
                <ArrowLeft />
                </Link>
            </Button>
             <Avatar className="shrink-0">
                <AvatarFallback><CircleUserRound /></AvatarFallback>
             </Avatar>
             <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                    <CardTitle className="truncate">Conversație cu {guestDisplayName}</CardTitle>
                    <CountdownTimer targetDate={activeTimerDate} onExpire={() => setTimerExpired(true)} />
                </div>
                {guestDisplayInfo && <p className="text-xs text-muted-foreground truncate">{guestDisplayInfo}</p>}
             </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isGuestAnonymous && (
                <Button variant="outline" size="sm" onClick={handleRequestIdentification} className="text-xs px-2 sm:px-3">
                <UserPlus className="mr-1 h-4 w-4"/>
                Solicită
                </Button>
            )}
             {conversation?.paymentStatus === 'pending' ? (
                <Button size="sm" onClick={handleConfirmPayment} className="text-xs px-2 sm:px-3">
                    <CheckCircle className="mr-1 h-4 w-4"/>
                    Confirmă
                </Button>
             ) : (
                <Button size="sm" onClick={() => setShowPaymentDialog(true)} className="text-xs px-2 sm:px-3">
                    <CreditCard className="mr-1 h-4 w-4"/>
                    Plată
                </Button>
             )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            {timerExpired && (
                 <div className="p-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Timpul a Expirat!</AlertTitle>
                        <AlertDescription>
                            {isFollowUpTimer 
                                ? 'Au trecut 2.5 ore de la plată. Este timpul pentru un follow-up sau pentru a oferi asistență suplimentară.'
                                : 'Au trecut 10 minute. Vă rugăm să solicitați identificarea și/sau plata pentru a continua.'
                            }
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            <div className="p-6 space-y-4">
              {isLoadingMessages ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-10 w-3/4 ml-auto" />
                    <Skeleton className="h-10 w-2/4" />
                 </div>
              ): (
                <>
                {messages && messages.map((msg: any) => {
                    if (msg.isSystemMessage) {
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
                                    <AvatarFallback><CircleUserRound className="w-5 h-5"/></AvatarFallback>
                                </Avatar>
                            )}
                            <div
                            className={cn(
                                'max-w-md rounded-lg px-3 py-2 text-sm',
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
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrieți răspunsul..."
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!message.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Trimite</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Solicită o Plată</DialogTitle>
                <DialogDescription>
                    Introduceți linkul de plată pe care doriți să îl trimiteți clientului. Acesta va vedea un link și un cod QR.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
                <Label htmlFor="payment-link">Link de Plată</Label>
                <Input 
                    id="payment-link"
                    value={paymentLink}
                    onChange={(e) => setPaymentLink(e.target.value)}
                    placeholder="https://stripe.com/pay/..."
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Anulează</Button>
                <Button onClick={handleRequestPayment} disabled={!paymentLink.trim()}>Trimite Solicitarea</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
