'use client';

import { useEffect } from 'react';
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

export default function AdminPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

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
  const isUserAdmin = adminRole && adminRole.isAdmin;

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isUserAdmin) return null;
    return query(
      collection(firestore, 'appointments'),
      orderBy('startTime', 'desc')
    );
  }, [firestore, isUserAdmin]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error,
  } = useCollection(appointmentsQuery);
  
  const showLoading = isUserLoading || isLoadingRole;

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
          {error && (
            <p className="text-destructive">
              Error al cargar las citas: {error.message}.
            </p>
          )}
          {!isLoadingAppointments && !error && appointments && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt: any) => (
                  <TableRow key={apt.id}>
                    <TableCell>{apt.clientName}</TableCell>
                    <TableCell>{apt.clientEmail}</TableCell>
                    <TableCell>
                      {apt.startTime && format(apt.startTime.toDate(), 'PPP p')}
                    </TableCell>
                    <TableCell>
                      <Badge>{apt.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {apt.notes}
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
    </div>
  );
}
