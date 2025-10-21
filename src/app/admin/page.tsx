
'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Trash2, Settings, Clock, MessageSquare, CircleUserRound } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const allPossibleTimes = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

const daysOfWeek = [
    { name: 'Duminică', value: 0 },
    { name: 'Luni', value: 1 },
    { name: 'Marți', value: 2 },
    { name: 'Miercuri', value: 3 },
    { name: 'Joi', value: 4 },
    { name: 'Vineri', value: 5 },
    { name: 'Sâmbătă', value: 6 },
]

export default function AdminPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isPublicRegistrationOpen, setIsPublicRegistrationOpen] = useState(false);
  
  const [durationHours, setDurationHours] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(30);

  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);

  // Chat settings state
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [chatType, setChatType] = useState('whatsapp');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
  
  const isUserAdmin = adminRole?.isAdmin === true;

  const registrationSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'registration');
  }, [firestore]);

  const { data: registrationSettings, isLoading: isLoadingRegistration } = useDoc(registrationSettingsRef);

  const scheduleSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'admin_settings', 'schedule');
  }, [firestore]);

  const { data: scheduleSettings, isLoading: isLoadingSchedule } = useDoc(scheduleSettingsRef);

  useEffect(() => {
    if (registrationSettings) {
      setIsPublicRegistrationOpen(registrationSettings.isPublicRegistrationOpen);
    }
  }, [registrationSettings]);

  useEffect(() => {
    if (scheduleSettings) {
      const totalMinutes = scheduleSettings.appointmentDurationMinutes || 150;
      setDurationHours(Math.floor(totalMinutes / 60));
      setDurationMinutes(totalMinutes % 60);

      setAvailableHours(scheduleSettings.availableHours || []);
      setAvailableDays(scheduleSettings.availableDays || []);

      setIsChatEnabled(scheduleSettings.isChatEnabled ?? false);
      setChatType(scheduleSettings.chatType ?? 'whatsapp');
      setWhatsAppNumber(scheduleSettings.whatsAppNumber ?? '');
    }
  }, [scheduleSettings]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isUserAdmin) return null;
    const coll = collection(firestore, 'appointments');
    return query(coll, orderBy('startTime', 'desc'));
  }, [firestore, isUserAdmin]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
  } = useCollection(appointmentsQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !isUserAdmin) return null;
    return collection(firestore, 'clients');
  }, [firestore, isUserAdmin]);

  const { data: clients, isLoading: isLoadingClients, error: clientsError } = useCollection(clientsQuery);
  
    const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "conversations"), orderBy("lastMessageAt", "desc"));
  }, [firestore, user?.uid]);

  const { data: conversations, isLoading: isLoadingConversations } = useCollection(conversationsQuery);
  
  const showLoading = isUserLoading || isLoadingRole;

  const handleDelete = (collectionName: string, docId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, collectionName, docId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: 'Element șters',
        description: `Elementul a fost șters cu succes.`,
    });
  };

  const handleRegistrationToggle = (isOpen: boolean) => {
    if (!registrationSettingsRef) return;
    setIsPublicRegistrationOpen(isOpen);
    setDocumentNonBlocking(registrationSettingsRef, { isPublicRegistrationOpen: isOpen }, { merge: true });
    toast({
      title: 'Setări actualizate',
      description: `Înregistrarea publică a fost ${isOpen ? 'activată' : 'dezactivată'}.`,
    });
  };
  
  const handleTimeToggle = (time: string) => {
    if (!scheduleSettingsRef) return;
    
    const isCurrentlyAvailable = availableHours.includes(time);
    
    updateDocumentNonBlocking(scheduleSettingsRef, {
        availableHours: isCurrentlyAvailable ? arrayRemove(time) : arrayUnion(time)
    });
    
    toast({
      title: 'Orar actualizat',
      description: `Ora ${time} a fost ${isCurrentlyAvailable ? 'dezactivată' : 'activată'}.`,
    });
  };

  const handleDayToggle = (dayValue: number) => {
    if (!scheduleSettingsRef) return;
    
    const isCurrentlyAvailable = availableDays.includes(dayValue);
    
    updateDocumentNonBlocking(scheduleSettingsRef, {
        availableDays: isCurrentlyAvailable ? arrayRemove(dayValue) : arrayUnion(dayValue)
    });
    
    toast({
      title: 'Zile actualizate',
      description: `Ziua a fost ${isCurrentlyAvailable ? 'dezactivată' : 'activată'}.`,
    });
  };


  const handleScheduleSettingsUpdate = () => {
    if (!scheduleSettingsRef) return;
    const totalMinutes = (durationHours * 60) + durationMinutes;
    updateDocumentNonBlocking(scheduleSettingsRef, { appointmentDurationMinutes: totalMinutes });
    toast({
      title: 'Setări actualizate',
      description: 'Durata blocării a fost actualizată.',
    });
  };

  const handleChatSettingsUpdate = (field: string, value: any) => {
    if (!scheduleSettingsRef) return;
    updateDocumentNonBlocking(scheduleSettingsRef, { [field]: value });
    toast({
      title: 'Setări Chat Actualizate',
      description: 'Configurația chatului a fost salvată.',
    });
  }

  if (showLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="text-center">
          <p>Se încarcă și se verifică accesul...</p>
        </div>
      </div>
    );
  }
  
  if (!isUserAdmin && !showLoading) {
     return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 text-center">
        <div>
          <h2 className="font-headline text-2xl font-bold text-destructive">Acces Interzis</h2>
          <p className="mt-2 text-muted-foreground">
            Nu aveți permisiuni de administrator pentru a vizualiza această pagină.
          </p>
           <Button asChild className="mt-4">
            <Link href="/">Înapoi la Acasă</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Panou de Administrare
        </h1>
        <Button asChild>
          <Link href="/">Înapoi la Acasă</Link>
        </Button>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare /> Conversații Active</CardTitle>
              <CardDescription>Aici puteți vedea și răspunde la mesajele vizitatorilor.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingConversations ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : conversations && conversations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vizitator</TableHead>
                      <TableHead>Ultimul Mesaj</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acțiune</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((convo: any) => (
                      <TableRow key={convo.id}>
                        <TableCell>
                            <div className="font-medium flex items-center gap-2">
                                <CircleUserRound className="text-muted-foreground"/>
                                <span>{convo.guestId.substring(0, 8)}...</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-xs">{convo.lastMessageText}</TableCell>
                        <TableCell>{convo.lastMessageAt && format(convo.lastMessageAt.toDate(), 'PPP p')}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/chat/${convo.id}`}>Răspunde</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nu există conversații active.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Programări Agendate</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
              {appointmentsError && (
                <p className="text-destructive">
                  Eroare la încărcarea programărilor: {appointmentsError.message}.
                </p>
              )}
              {!isLoadingAppointments && !appointmentsError && appointments && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Data și Ora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt: any) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div className="font-medium">{apt.clientName}</div>
                          <div className="text-sm text-muted-foreground">{apt.clientEmail}</div>
                          </TableCell>
                        <TableCell>
                          {apt.startTime && format(apt.startTime.toDate(), 'PPP p')}
                        </TableCell>
                        <TableCell>
                          <Badge>{apt.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Această acțiune nu poate fi anulată. Aceasta va șterge permanent programarea.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulează</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete('appointments', apt.id)}>
                                  Șterge
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!isLoadingAppointments && appointments?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nu există programări agendate.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clienți Înregistrați</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingClients && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
              {clientsError && (
                <p className="text-destructive">
                  Eroare la încărcarea clienților: {clientsError.message}.
                </p>
              )}
              {!isLoadingClients && !clientsError && clients && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nume</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client: any) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.firstName} {client.lastName}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Această acțiune nu poate fi anulată. Aceasta va șterge permanent clientul și toate programările asociate.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete('clients', client.id)}>
                                    Șterge
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!isLoadingClients && clients?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nu există clienți înregistrați.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 grid gap-8 content-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Setări Generale
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRegistration ? (
                 <div className="flex items-center justify-between space-x-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-6 w-11" />
                  </div>
              ): (
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="public-registration" className="font-medium">
                  Activează Înregistrarea Publică
                </Label>
                <Switch
                  id="public-registration"
                  checked={isPublicRegistrationOpen}
                  onCheckedChange={handleRegistrationToggle}
                />
              </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Permite utilizatorilor să își creeze un cont nou din antet.
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Setări Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSchedule ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="chat-enabled" className="font-medium">
                      Activează Chat Widget
                    </Label>
                    <Switch
                      id="chat-enabled"
                      checked={isChatEnabled}
                      onCheckedChange={(checked) => {
                        setIsChatEnabled(checked);
                        handleChatSettingsUpdate('isChatEnabled', checked);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tip Chat</Label>
                    <RadioGroup
                      value={chatType}
                      onValueChange={(value) => {
                        setChatType(value);
                        handleChatSettingsUpdate('chatType', value);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whatsapp" id="whatsapp" />
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="internal" id="internal" />
                        <Label htmlFor="internal">Chat Intern</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {chatType === 'whatsapp' && (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-number">Număr WhatsApp</Label>
                      <Input
                        id="whatsapp-number"
                        placeholder="+40712345678"
                        value={whatsAppNumber}
                        onChange={(e) => setWhatsAppNumber(e.target.value)}
                        onBlur={() => handleChatSettingsUpdate('whatsAppNumber', whatsAppNumber)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Includeți codul țării.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Setări Programări
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSchedule ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-24" />
                  <div className="grid grid-cols-4 gap-2">
                    {allPossibleTimes.slice(0,8).map(time => <Skeleton key={time} className="h-9 w-full" />)}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label>Timp de blocare după programare</Label>
                    <div className="flex items-center gap-2 mt-2">
                        <Input
                            id="duration-hours"
                            type="number"
                            value={durationHours}
                            onChange={(e) => setDurationHours(Number(e.target.value))}
                            onBlur={handleScheduleSettingsUpdate}
                            className="w-16"
                        />
                        <Label htmlFor="duration-hours">ore</Label>
                        <Input
                            id="duration-minutes"
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            onBlur={handleScheduleSettingsUpdate}
                            className="w-16"
                            step={15}
                        />
                        <Label htmlFor="duration-minutes">min</Label>
                    </div>
                     <p className="text-sm text-muted-foreground mt-1">
                      Apasă Enter sau ieși din câmp pentru a salva.
                    </p>
                  </div>
                  
                  <div>
                    <Label>Zile Disponibile</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.value}
                          variant={availableDays.includes(day.value) ? "default" : "outline"}
                          onClick={() => handleDayToggle(day.value)}
                          className={cn("transition-colors text-xs px-2 h-8", availableDays.includes(day.value) && "bg-primary text-primary-foreground")}
                        >
                          {day.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Ore Disponibile</Label>
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                        {allPossibleTimes.map((time) => {
                            const isAvailable = availableHours.includes(time);
                            return (
                                <Button
                                    key={time}
                                    variant={isAvailable ? "default" : "outline"}
                                    onClick={() => handleTimeToggle(time)}
                                    className={cn("transition-colors", isAvailable && "bg-primary text-primary-foreground")}
                                >
                                    {time}
                                </Button>
                            );
                        })}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Selectează orele la care ești disponibil pentru programări.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    