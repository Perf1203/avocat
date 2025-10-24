
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { Send, ArrowLeft, CircleUserRound, UserPlus, CreditCard, CheckCircle, Clock, AlertCircle, FileDown, MoreVertical, Calendar, FileSignature, Paperclip, File as FileIcon, Image as ImageIcon, Download, X } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { generateBill } from '@/lib/generate-bill';
import { generateContract } from '@/lib/generate-contract';
import { SignatureDialog } from '@/components/signature-dialog';
import Image from 'next/image';

const FILE_SIZE_LIMIT = 1024 * 1024 * 0.9; // 0.9 MB to stay safely under Firestore's 1MB limit

// CountdownTimer Component
const CountdownTimer = ({ targetDate, onExpire }: { targetDate: Date | null, onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) {
        setTimeLeft('');
        return;
    };

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

  if (!targetDate || timeLeft === 'Timp expirat') return null;

  return (
    <span className="text-xs font-mono flex items-center gap-1 text-amber-600">
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
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [timerExpired, setTimerExpired] = useState(false);
  const [isSignatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [contractAdminName, setContractAdminName] = useState('');


  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'admin_settings', 'schedule');
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);
  const websiteName = settings?.websiteName || "Avocat Law";
  
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

    // Admin Availability Status Management
    const adminStatusRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'admin_status', user.uid);
    }, [firestore, user?.uid]);

    useEffect(() => {
        if (adminStatusRef) {
            // Set status to "occupied" when entering a conversation
            setDocumentNonBlocking(adminStatusRef, { status: 'occupied', lastSeen: serverTimestamp() }, {});

            // Set status back to "available" when leaving the conversation page
            return () => {
                setDocumentNonBlocking(adminStatusRef, { status: 'available', lastSeen: serverTimestamp() }, {});
            };
        }
    }, [adminStatusRef]);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
     if (user) {
      setContractAdminName(user.displayName || 'Administrator');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }
  }, [messages, timerExpired, isLoadingMessages]);

  useEffect(() => {
    // Mark conversation as read by admin
    if (conversationRef && conversation && !conversation.isReadByAdmin) {
      updateDocumentNonBlocking(conversationRef, { isReadByAdmin: true });
    }
  }, [conversationRef, conversation]);
  
  useEffect(() => {
    setTimerExpired(false);
  }, [conversationId]);

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
    if (!firestore || !user || (!message.trim() && !file) || !conversationId || !conversationRef) return;

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
      ...fileData,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    
    // Update last message on conversation
    updateDocumentNonBlocking(conversationRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageText: file ? file.name : message,
    });

    setMessage('');
    setFile(null);
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
    if (!conversationRef || !paymentLink.trim() || !paymentAmount) return;

    const amount = typeof paymentAmount === 'string' ? parseFloat(paymentAmount) : paymentAmount;
    if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: 'Sumă Invalidă', description: 'Vă rugăm introduceți o sumă validă.'});
        return;
    }

    const paymentData = {
        paymentLink,
        paymentAmount: amount,
        paymentStatus: 'pending',
        paymentRequestedAt: serverTimestamp()
    };
    updateDocumentNonBlocking(conversationRef, paymentData);

    const messagesCol = collection(firestore, 'conversations', conversationId, 'messages');
    addDocumentNonBlocking(messagesCol, {
        text: `Solicitare de plată (${amount}€) trimisă: ${paymentLink}`,
        senderId: user?.uid,
        timestamp: serverTimestamp(),
        isSystemMessage: true,
        systemMessageType: 'payment_request',
        paymentLink: paymentLink,
        paymentAmount: amount
    });

    toast({
        title: 'Solicitare de plată trimisă',
        description: 'Linkul de plată a fost trimis vizitatorului.'
    });
    setShowPaymentDialog(false);
    setPaymentLink('');
    setPaymentAmount('');
  };

  const handleConfirmPayment = () => {
    if (!conversationRef || !user || !conversation?.paymentAmount) return;
    setTimerExpired(false); // Reset timer expired state
    const followUpDate = new Date();
    followUpDate.setMinutes(followUpDate.getMinutes() + 150); // 2.5 hours from now

    const confirmedPayment = {
        amount: conversation.paymentAmount,
        link: conversation.paymentLink,
        confirmedAt: new Date(),
    };

    // Atomically update conversation
    updateDocumentNonBlocking(conversationRef, { 
      payments: arrayUnion(confirmedPayment),
      paymentStatus: 'paid', // Keep this to show "Factura" button, might change logic later
      paymentAmount: null, // Clear pending amount
      paymentLink: null, // Clear pending link
      paymentRequestedAt: null, // Clear pending request time
      followUpAt: followUpDate, // Set new follow-up
      reminderAt: null // Clear the initial reminder
    });

     const messagesCol = collection(firestore, 'conversations', conversationId, 'messages');
    addDocumentNonBlocking(messagesCol, {
        text: `Plata de ${conversation.paymentAmount}€ a fost confirmată.`,
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

  const handleDownloadBill = () => {
    if (!conversation || !conversation.payments || conversation.payments.length === 0) {
        toast({ variant: 'destructive', title: 'Eroare', description: 'Nicio plată confirmată pentru a genera factura.' });
        return;
    }
    generateBill(conversation, websiteName);
  };
  
    const handleRequestSchedule = () => {
    if (!firestore || !user?.uid || !conversationRef) return;

    addDocumentNonBlocking(collection(firestore, 'conversations', conversationId, 'messages'), {
      text: "Am dori să programăm o întâlnire cu dvs. Vă rugăm să folosiți butonul de mai jos.",
      senderId: user.uid,
      timestamp: serverTimestamp(),
      isSystemMessage: true,
      systemMessageType: 'schedule_request',
    });

    updateDocumentNonBlocking(conversationRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageText: "Solicitare de programare trimisă.",
    });

    toast({
        title: 'Solicitare Trimisă',
        description: 'Solicitarea de programare a fost trimisă vizitatorului.'
    });
  };

  const handleSendContract = () => {
      if (!conversationRef || !contractAdminName.trim()) {
        toast({ variant: 'destructive', title: 'Nume invalid', description: 'Numele administratorului nu poate fi gol.' });
        return;
      };
      
      const contractData = {
          sentAt: serverTimestamp(),
          status: 'pending',
          guestSignature: null,
          adminSignature: null,
          adminName: contractAdminName,
          text: settings?.contractTemplate || 'Prestatorul se obligă să furnizeze Beneficiarului servicii de consultanță juridică online prin intermediul platformei de chat, conform termenilor și condițiilor agreate în conversație.',
      };

      updateDocumentNonBlocking(conversationRef, { contract: contractData });
      
      addDocumentNonBlocking(collection(firestore, 'conversations', conversationId, 'messages'), {
          text: "V-a fost trimis un contract pentru semnare.",
          senderId: user?.uid,
          timestamp: serverTimestamp(),
          isSystemMessage: true,
          systemMessageType: 'contract_sent',
      });

      toast({
          title: 'Contract Trimis',
          description: 'Contractul a fost trimis vizitatorului pentru semnare.'
      });
      setShowContractDialog(false);
  };

  const handleSignContract = (signatureDataUrl: string) => {
      if (!conversationRef || !user || !conversation.contract) return;

      const signatureData: { [key: string]: any } = {
          'contract.adminSignature': signatureDataUrl,
          'contract.adminSignedAt': new Date(),
      };
      
      if (conversation.contract.guestSignature) {
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

   const FileAttachmentCard = ({ msg }: { msg: any }) => {
    const isImage = msg.fileType?.startsWith('image/');
    const Icon = isImage ? ImageIcon : FileIcon;

    return (
        <div className={cn('flex items-end gap-2', msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
             {msg.senderId !== user?.uid && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><CircleUserRound className="w-5 h-5"/></AvatarFallback>
                </Avatar>
            )}
            <div className={cn('max-w-md rounded-lg text-sm', msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                {isImage ? (
                    <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noopener noreferrer">
                      <Image src={msg.fileUrl} alt={msg.fileName} width={256} height={256} className="rounded-t-lg object-cover max-w-xs" />
                    </a>
                ) : null}
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
                    {msg.text && <p className="mt-2 pt-2 border-t border-white/20">{msg.text}</p>}
                </div>
            </div>
        </div>
    );
};

  if (isUserLoading || isLoadingConversation) {
    return <div className="container py-12"><Skeleton className="h-[70vh] w-full" /></div>;
  }

  const guestDisplayName = conversation?.guestName || 'Vizitator';
  const guestDisplayInfo = conversation?.guestEmail || (conversation?.guestId ? `${conversation.guestId.substring(0, 12)}...` : 'ID Indisponibil');
  
  const activeTimerDate = conversation?.followUpAt?.toDate() || conversation?.reminderAt?.toDate() || null;
  const isFollowUpTimer = !!conversation?.followUpAt && !!conversation?.payments?.length;

  const hasConfirmedPayments = conversation?.payments && conversation.payments.length > 0;
  
  const contract = conversation?.contract;
  const canAdminSign = contract && !contract.adminSignature;
  const isContractSigned = contract && contract.status === 'signed';

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
             {conversation?.paymentStatus === 'pending' && (
                <Button size="sm" onClick={handleConfirmPayment} className="text-xs px-2 sm:px-3">
                    <CheckCircle className="mr-1 h-4 w-4"/>
                    Confirmă
                </Button>
             )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Mai multe acțiuni</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {!conversation?.guestName && (
                        <DropdownMenuItem onClick={handleRequestIdentification}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Solicită Identitate</span>
                        </DropdownMenuItem>
                    )}
                     <DropdownMenuItem onClick={() => setShowPaymentDialog(true)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Solicită Plată</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={handleRequestSchedule}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Solicită Programare</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowContractDialog(true)}>
                        <FileSignature className="mr-2 h-4 w-4" />
                        <span>Trimite Contract</span>
                    </DropdownMenuItem>
                    {hasConfirmedPayments && (
                        <DropdownMenuItem onClick={handleDownloadBill}>
                            <FileDown className="mr-2 h-4 w-4" />
                            <span>Descarcă Factura</span>
                        </DropdownMenuItem>
                    )}
                     {contract && (
                        <DropdownMenuItem onClick={handleDownloadContract}>
                            <FileDown className="mr-2 h-4 w-4" />
                            <span>Descarcă Contractul</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {timerExpired && (
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
              )}
              {isLoadingMessages ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-10 w-3/4 ml-auto" />
                    <Skeleton className="h-10 w-2/4" />
                 </div>
              ): (
                <>
                {messages && messages.map((msg: any) => {
                    if (msg.fileUrl) {
                      return <FileAttachmentCard key={msg.id} msg={msg} />;
                    }
                    if (msg.isSystemMessage) {
                        if (msg.systemMessageType === 'schedule_request') {
                          return (
                            <div key={msg.id} className="text-center text-xs text-muted-foreground my-4">
                                --- Solicitare de programare trimisă ---
                            </div>
                          );
                        }
                         if (msg.systemMessageType === 'contract_sent' && contract) {
                          return (
                             <div key={msg.id} className="p-4 my-2 rounded-lg border bg-blue-100 dark:bg-blue-900/50 text-center">
                                <h4 className="font-semibold flex items-center justify-center gap-2 mb-3"><FileSignature /> Contract pentru Semnare</h4>
                                {isContractSigned ? (
                                    <div className='text-center'>
                                        <p className="text-sm text-green-600 font-medium mb-3">✓ Semnat de ambele părți</p>
                                        <Button size="sm" variant="secondary" onClick={handleDownloadContract}><FileDown className="mr-2"/>Descarcă PDF</Button>
                                    </div>
                                ) : (
                                    <div className='text-center space-y-3'>
                                        <div className='space-y-1'>
                                            {contract.guestSignature ? 
                                                <p className="text-sm font-medium text-green-600">✓ Semnat de Client</p>
                                                : <p className="text-sm text-amber-600">Așteaptă semnătura clientului</p>
                                            }
                                            {contract.adminSignature ?
                                                <p className="text-sm font-medium text-green-600">✓ Semnat de Administrator</p>
                                                : <p className="text-sm text-amber-600">Așteaptă semnătura dvs.</p>
                                            }
                                        </div>
                                        {canAdminSign ? (
                                          <Button size="sm" onClick={() => setSignatureDialogOpen(true)}>Semnează Contractul</Button>
                                        ) : contract.guestSignature ? (
                                           <p className="text-sm text-muted-foreground">Ați semnat deja.</p>
                                        ) : null}
                                        <Button size="sm" variant="secondary" onClick={handleDownloadContract}><FileDown className="mr-2"/>Descarcă PDF</Button>
                                    </div>
                                )}
                            </div>
                          );
                        }
                         if (msg.systemMessageType === 'payment_request' && msg.paymentLink) {
                            return (
                                <div key={msg.id} className="text-center text-xs text-muted-foreground my-4">
                                    --- {`Solicitare de plată (${msg.paymentAmount}€) trimisă: ${msg.paymentLink}`} ---
                                </div>
                            );
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
            <form onSubmit={handleSendMessage} className="flex gap-2 w-full items-center">
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
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
                placeholder="Scrieți răspunsul..."
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!message.trim() && !file}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Trimite</span>
              </Button>
            </form>
          </div>
        </CardFooter>
      </Card>
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Solicită o Plată</DialogTitle>
                <DialogDescription>
                    Introduceți detaliile de plată pe care doriți să le trimiteți clientului.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="payment-amount">Suma de Plată (€)</Label>
                    <Input 
                        id="payment-amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="ex: 50"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="payment-link">Link de Plată</Label>
                    <Input 
                        id="payment-link"
                        value={paymentLink}
                        onChange={(e) => setPaymentLink(e.target.value)}
                        placeholder="https://stripe.com/pay/..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Anulează</Button>
                <Button onClick={handleRequestPayment} disabled={!paymentLink.trim() || !paymentAmount}>Trimite Solicitarea</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
       <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Trimite Contract</DialogTitle>
                <DialogDescription>
                    Confirmați numele reprezentantului pentru acest contract. Acesta va fi afișat în documentul PDF.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
                <Label htmlFor="admin-name">Nume Reprezentant (Prestator)</Label>
                <Input 
                    id="admin-name"
                    value={contractAdminName}
                    onChange={(e) => setContractAdminName(e.target.value)}
                    placeholder="Numele dvs. complet"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowContractDialog(false)}>Anulează</Button>
                <Button onClick={handleSendContract} disabled={!contractAdminName.trim()}>Trimite Contractul</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <SignatureDialog
        isOpen={isSignatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        onSave={handleSignContract}
      />
    </div>
  );
}
