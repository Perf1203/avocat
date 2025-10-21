
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { Send, ArrowLeft, CircleUserRound, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function ChatConversationPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { toast } = useToast();

  const [message, setMessage] = useState('');
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
  }, [messages]);

  useEffect(() => {
    // Mark conversation as read by admin
    if (conversationRef && conversation && !conversation.isReadByAdmin) {
      setDoc(conversationRef, { isReadByAdmin: true }, { merge: true });
    }
  }, [conversationRef, conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !message.trim() || !conversationId) return;

    const messagesCol = collection(firestore, 'conversations', conversationId, 'messages');
    await addDoc(messagesCol, {
      text: message,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    
    // Update last message on conversation
    if (conversationRef) {
        await setDoc(conversationRef, {
            lastMessageAt: serverTimestamp(),
            lastMessageText: message,
        }, { merge: true });
    }

    setMessage('');
  };

  const handleRequestIdentification = () => {
    if (!conversationRef) return;
    updateDocumentNonBlocking(conversationRef, { identificationRequested: true });
    toast({
        title: 'Cerere trimisă',
        description: 'Cererea de identificare a fost trimisă vizitatorului.'
    });
  }

  if (isUserLoading || isLoadingConversation) {
    return <div className="container py-12"><Skeleton className="h-[70vh] w-full" /></div>;
  }

  const guestDisplayName = conversation?.guestName || 'Vizitator';
  const guestDisplayInfo = conversation?.guestEmail || (conversation?.guestId ? `${conversation.guestId.substring(0, 12)}...` : '');
  const isGuestAnonymous = !conversation?.guestName;

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader className="flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/admin">
                <ArrowLeft />
                </Link>
            </Button>
             <Avatar>
                <AvatarFallback><CircleUserRound /></AvatarFallback>
             </Avatar>
             <div>
                <CardTitle>Conversație cu {guestDisplayName}</CardTitle>
                {guestDisplayInfo && <p className="text-xs text-muted-foreground">{guestDisplayInfo}</p>}
             </div>
          </div>
          {isGuestAnonymous && (
            <Button variant="outline" size="sm" onClick={handleRequestIdentification}>
              <UserPlus className="mr-2 h-4 w-4"/>
              Solicită Identificare
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {isLoadingMessages ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-10 w-3/4 ml-auto" />
                    <Skeleton className="h-10 w-2/4" />
                 </div>
              ): (
                <>
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
                    ))}
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
    </div>
  );
}

    