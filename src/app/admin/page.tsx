'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Trash2, Settings } from 'lucide-react';
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
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AdminPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isPublicRegistrationOpen, setIsPublicRegistrationOpen] = useState(false);

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
    if (!firestore) return null; // Removed admin check to allow settings fetch for all logged-in users initially
    return doc(firestore, 'app_settings', 'registration');
  }, [firestore]);

  const { data: registrationSettings, isLoading: isLoadingRegistration } = useDoc(registrationSettingsRef);

  useEffect(() => {
    if (registrationSettings) {
      setIsPublicRegistrationOpen(registrationSettings.isPublicRegistrationOpen);
    }
  }, [registrationSettings]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isUserAdmin) return null;
    // This path is incorrect, it should query the nested collection
    // but for now, let's assume a top-level `appointments` collection
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
        <div className="lg:col-span-1">
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
        </div>
      </div>
    </div>
  );
}
