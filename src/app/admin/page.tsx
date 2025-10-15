'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
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
import { Trash2 } from 'lucide-react';
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

export default function AdminPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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
  
  const showLoading = isUserLoading || isLoadingRole;

  const handleDelete = async (collectionName: string, docId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, collectionName, docId));
      toast({
        title: 'Elemento eliminado',
        description: `El elemento ha sido eliminado correctamente.`,
      });
    } catch (error) {
      console.error("Error eliminando documento: ", error);
      toast({
        variant: "destructive",
        title: 'Error',
        description: `No se pudo eliminar el elemento.`,
      });
    }
  };

  if (showLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="text-center">
          <p>Cargando y verificando acceso...</p>
        </div>
      </div>
    );
  }
  
  if (!isUserAdmin && !showLoading) {
     return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 text-center">
        <div>
          <h2 className="font-headline text-2xl font-bold text-destructive">Acceso Denegado</h2>
          <p className="mt-2 text-muted-foreground">
            No tienes permisos de administrador para ver esta página.
          </p>
           <Button asChild className="mt-4">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Panel de Administrador
        </h1>
        <Button asChild>
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Citas Agendadas</CardTitle>
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
                Error al cargar las citas: {appointmentsError.message}.
              </p>
            )}
            {!isLoadingAppointments && !appointmentsError && appointments && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
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
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la cita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete('appointments', apt.id)}>
                                Eliminar
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
                No hay citas agendadas.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes Registrados</CardTitle>
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
                Error al cargar los clientes: {clientsError.message}.
              </p>
            )}
            {!isLoadingClients && !clientsError && clients && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
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
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y todas sus citas asociadas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete('clients', client.id)}>
                                  Eliminar
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
                No hay clientes registrados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
