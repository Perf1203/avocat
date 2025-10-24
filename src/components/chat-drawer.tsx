
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, LogOut, User as UserIcon, Mail, Info, CreditCard, CheckCircle, FileDown, Calendar, FileSignature, Paperclip, File as FileIcon, Image as ImageIcon, Download, X } from 'lucide-react';
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
import { generateContract } from '@/lib/generate-contract';
import { SignatureDialog } from './signature-dialog';

const FILE_SIZE_LIMIT = 1024 * 1024 * 0.9; // 0.9 MB to stay safely under Firestore's 1MB limit

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
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Identification state
  const [showIdentification, setShowIdentification] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSignatureDialogOpen, setSignatureDialogOpen] = useState(false);
  
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
            lastMessageText: file ? file.name : (message || 'Conversație nouă începută'),
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

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || (!message.trim() && !file)) return;

    let currentConversationId = conversationId;

    if (!currentConversationId) {
        currentConversationId = await handleStartConversation();
        if (!currentConversationId) return;
    }

    let fileData: { fileUrl: string, fileName: string, fileType: string } | null = null;
    if (file) {
      if (file.size > FILE_SIZE_LIMIT) {
        toast({
          variant: 'destructive',
          title: 'Fișier prea mare',
          description: `Fișierul este prea mare. Limita este de ${Math.floor(FILE_SIZE_LIMIT / (1024 * 1024))}MB.`,
        });
        return;
      }
      try {
        const fileUrl = await fileToDataURL(file);
        fileData = {
          fileUrl,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream'
        };
      } catch (error) {
        toast({ variant: 'destructive', title: 'Eroare fișier', description: 'Nu s-a putut citi fișierul.' });
        return;
      }
    }

    const messagesCol = collection(firestore, 'conversations', currentConversationId, 'messages');
    await addDoc(messagesCol, {
      text: message,
      ...fileData,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    
    const convoRef = doc(firestore, 'conversations', currentConversationId);
    await setDoc(convoRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageText: file ? file.name : message,
        isReadByAdmin: false,
    }, { merge: true });

    setMessage('');
    setFile(null);
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
  
  const handleSignContract = (signatureDataUrl: string) => {
      if (!conversationRef || !conversation.contract) return;

      const signatureData: { [key: string]: any } = {
          'contract.guestSignature': signatureDataUrl,
          'contract.guestSignedAt': new Date(),
      };
      
      if (conversation.contract.adminSignature) {
        signatureData['contract.status'] = 'signed';
      }

      updateDocumentNonBlocking(conversationRef, signatureData);

      toast({ title: 'Contract Semnat', description: 'Ați semnat contractul.' });
      setSignatureDialogOpen(false);
  };
  
  const handleDownloadContract = () => {
    if (!conversation || !conversation.contract) return;
    generateContract(conversation, websiteName);
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

  const FileAttachmentCard = ({ msg }: { msg: any }) => {
    const isImage = msg.fileType?.startsWith('image/');
    const Icon = isImage ? ImageIcon : FileIcon;

    return (
        <div className={cn('flex items-end gap-2', msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
            {msg.senderId !== user?.uid && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
            )}
            <div className={cn('max-w-md rounded-lg text-sm', msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                {isImage && msg.fileUrl && (
                    <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noopener noreferrer">
                      <Image src={msg.fileUrl} alt={msg.fileName} width={256} height={256} className="rounded-t-lg object-cover max-w-xs" />
                    </a>
                )}
                <div className="p-3">
                    <div className="flex items-center gap-3">
                        <Icon className="h-8 w-8 shrink-0" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{msg.fileName}</p>
                            <a href={msg.fileUrl} download={msg.fileName} className="text-xs flex items-center gap-1 hover:underline">
                                <Download size={12} /> Descarcă
                            </a>
                        </div>
                    </div>
                    {msg.text && <p className="mt-2 pt-2 border-t border-black/20 dark:border-white/20">{msg.text}</p>}
                </div>
            </div>
        </div>
    );
};
  
  const isChatting = messages && messages.length > 0;
  const isMandatoryIdentification = conversation?.identificationRequested && !conversation?.guestName;

  const contract = conversation?.contract;
  const canGuestSign = contract && !contract.guestSignature;
  const isContractSigned = contract && contract.status === 'signed';

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
                 if (msg.fileUrl) {
                    return <FileAttachmentCard key={msg.id} msg={msg} />;
                 }
                 if (msg.isSystemMessage) {
                    if (msg.systemMessageType === 'schedule_request') {
                        return (
                            <div key={msg.id} className="p-4 my-2 rounded-lg border bg-secondary/50 text-center">
                                <h4 className="font-semibold flex items-center justify-center gap-2 mb-3"><Calendar /> Solicitare de Programare</h4>
                                <p className="text-sm text-muted-foreground mb-3">Administratorul v-a invitat să programați o consultație.</p>
                                <Button asChild size="sm">
                                    <Link href="/schedule">Mergi la Programări</Link>
                                </Button>
                            </div>
                        );
                    }
                    if (msg.systemMessageType === 'contract_sent' && contract) {
                        return (
                            <div key={msg.id} className="p-4 my-2 rounded-lg border bg-blue-100 dark:bg-blue-900/50 text-center">
                                <h4 className="font-semibold flex items-center justify-center gap-2 mb-3"><FileSignature /> Contract pentru Semnare</h4>
                                {isContractSigned ? (
                                    <div className='text-center space-y-3'>
                                        <p className="text-sm text-green-600 font-medium">✓ Semnat de ambele părți</p>
                                        <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground">
                                          <div className="p-2 border bg-white rounded-md flex flex-col items-center justify-center"><span>Client</span><span className='font-semibold text-green-600'>✓ SEMNAT</span></div>
                                          <div className="p-2 border bg-white rounded-md flex flex-col items-center justify-center"><span>Admin</span><span className='font-semibold text-green-600'>✓ SEMNAT</span></div>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={handleDownloadContract}><FileDown className="mr-2"/>Descarcă PDF</Button>
                                    </div>
                                ) : canGuestSign ? (
                                    <div className='text-center space-y-3'>
                                         <div className='space-y-1'>
                                            {contract.adminSignature ? 
                                                <p className="text-sm font-medium text-green-600">✓ Semnat de Administrator</p>
                                                : <p className="text-sm text-amber-600">Așteaptă semnătura administratorului</p>
                                            }
                                            <p className="text-sm text-amber-600">Așteaptă semnătura dvs.</p>
                                        </div>
                                        <Button size="sm" onClick={() => setSignatureDialogOpen(true)}>Semnează Contractul</Button>
                                    </div>
                                ) : (
                                     <p className="text-sm text-muted-foreground">Așteaptă semnătura administratorului.</p>
                                )}
                            </div>
                        );
                    }
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
          <div className="relative w-full">
            {file && (
              <div className="absolute bottom-full left-0 w-full p-2 bg-secondary/80 backdrop-blur-sm rounded-t-lg">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={showIdentification}>
                <Paperclip />
              </Button>
              <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
              />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrieți mesajul..."
                autoComplete="off"
                disabled={showIdentification}
              />
              <Button type="submit" size="icon" disabled={(!message.trim() && !file) || showIdentification}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Trimite</span>
              </Button>
            </form>
          </div>
        </div>
        <SignatureDialog
            isOpen={isSignatureDialogOpen}
            onOpenChange={setSignatureDialogOpen}
            onSave={handleSignContract}
        />
      </SheetContent>
    </Sheet>
  );
}
