
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useFirebase, useUser, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, setDoc, where, getDocs, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    // Sync conversationId with localStorage on component mount
    const storedConversationId = localStorage.getItem('conversationId');
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }
  }, []);

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
  }, [messages]);
  
  const handleLeaveChat = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      localStorage.removeItem('conversationId');
      setConversationId(null);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !message.trim()) return;

    let currentConversationId = conversationId;

    if (!currentConversationId) {
        // Create a new conversation if one doesn't exist
        const adminQuery = query(collection(firestore, 'roles_admin'), where('isAdmin', '==', true), limit(1));
        const adminSnapshot = await getDocs(adminQuery);
        const adminId = !adminSnapshot.empty ? adminSnapshot.docs[0].id : 'default-admin-id';

        const newConversationRef = doc(collection(firestore, 'conversations'));
        const newConvoData = {
            guestId: user.uid,
            adminId: adminId, 
            createdAt: serverTimestamp(),
            lastMessageAt: serverTimestamp(),
            lastMessageText: message,
            isReadByAdmin: false,
        };
        await setDoc(newConversationRef, newConvoData);
        currentConversationId = newConversationRef.id;
        setConversationId(currentConversationId);
        localStorage.setItem('conversationId', currentConversationId);
    }

    const messagesCol = collection(firestore, 'conversations', currentConversationId, 'messages');
    await addDoc(messagesCol, {
      text: message,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    
    // Update last message on conversation
    const convoRef = doc(firestore, 'conversations', currentConversationId);
    await setDoc(convoRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageText: message,
        isReadByAdmin: false,
    }, { merge: true });

    setMessage('');
  };

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
             Părăsiți chat
           </Button>
        </SheetHeader>
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
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
