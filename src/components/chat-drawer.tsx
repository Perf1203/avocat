
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface ChatDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChatDrawer({ isOpen, onOpenChange }: ChatDrawerProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(localStorage.getItem('conversationId'));
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return query(collection(firestore, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, conversationId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !message.trim()) return;

    let currentConversationId = conversationId;

    if (!currentConversationId) {
        // Find an admin to assign the chat to. For now, this logic is simplified.
        // In a real app, you'd have a more robust way of assigning admins.
        const newConversationRef = doc(collection(firestore, 'conversations'));
        const newConvoData = {
            guestId: user.uid,
            adminId: 'default-admin-id', // Placeholder, needs real logic
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
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Contactați-ne</SheetTitle>
          <SheetDescription>Lăsați-ne un mesaj și vă vom răspunde în curând.</SheetDescription>
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

    