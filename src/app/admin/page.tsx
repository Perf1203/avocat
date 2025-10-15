'use client';

import { useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { useMemoFirebase } from '@/firebase/provider';
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

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // This query is intentionally broad for the admin view.
    // In a real-world scenario, you might add more complex queries or pagination.
    return query(
      collection(firestore, 'appointments'),
      orderBy('startTime', 'desc')
    );
  }, [firestore]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error,
  } = useCollection(appointmentsQuery);

  if (isUserLoading || !user) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="text-center">
          <p>Cargando y verificando acceso...</p>
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
              Error al cargar las citas: {error.message}. Es posible que no tengas permisos de administrador.
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
