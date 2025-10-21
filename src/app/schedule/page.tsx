
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, isPast, isToday, startOfDay, endOfDay } from "date-fns";
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { collection, Timestamp, query, where, doc } from "firebase/firestore";


import { AppointmentSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

type AppointmentFormData = z.infer<typeof AppointmentSchema>;

export default function SchedulePage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const scheduleSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'admin_settings', 'schedule');
  }, [firestore]);

  const { data: scheduleSettings, isLoading: isLoadingSchedule } = useDoc(scheduleSettingsRef);
  const appointmentDuration = scheduleSettings?.appointmentDurationMinutes || 150;
  const availableTimes = scheduleSettings?.availableHours?.sort() || [];


  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !date) return null;
    const start = startOfDay(date);
    const end = endOfDay(date);
    return query(
      collection(firestore, 'appointments'),
      where('startTime', '>=', Timestamp.fromDate(start)),
      where('startTime', '<=', Timestamp.fromDate(end))
    );
  }, [firestore, date]);

  const { data: appointmentsOnSelectedDate } = useCollection(appointmentsQuery);

  const blockedSlots = useMemo(() => {
    if (!appointmentsOnSelectedDate) return new Set();
    const blocked = new Set<string>();
    
    (appointmentsOnSelectedDate as any[]).forEach(apt => {
        const startTime = apt.startTime.toDate();
        const endTime = addMinutes(startTime, appointmentDuration);
        
        availableTimes.forEach(timeSlot => {
            const slotTime = getFullDateTime(timeSlot, date);
            // Block the booked slot itself
            if (format(startTime, 'HH:mm') === timeSlot) {
                blocked.add(timeSlot);
            }
            // Block slots that fall within the duration of an existing appointment
            if(slotTime > startTime && slotTime < endTime) {
                blocked.add(timeSlot)
            }
        })
    });
    return blocked;
  }, [appointmentsOnSelectedDate, appointmentDuration, date, availableTimes]);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      issue: "",
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    if (!firestore || !date || !selectedTime) return;
    setIsLoading(true);

    const fullDateTime = getFullDateTime(selectedTime, date);

    const appointmentData = {
      clientName: data.name,
      clientEmail: data.email,
      clientPhone: data.phone,
      notes: data.issue,
      startTime: Timestamp.fromDate(fullDateTime),
      status: "scheduled",
      createdAt: Timestamp.now(),
    };
    
    const clientData = {
      firstName: data.name.split(' ')[0],
      lastName: data.name.split(' ').slice(1).join(' '),
      email: data.email,
      phoneNumber: data.phone,
    };
    const clientsCol = collection(firestore, 'clients');
    const appointmentsCol = collection(firestore, 'appointments');

    addDocumentNonBlocking(clientsCol, clientData);
    addDocumentNonBlocking(appointmentsCol, appointmentData)
      .then(() => {
        setIsConfirmed(true);
        toast({
          title: "Programare Confirmată!",
          description: `Consultația dvs. este programată pentru ${format(fullDateTime, "PPP 'la' p")}.`,
        });
      })
      .catch((error) => {
        console.error("Eroare la programare:", error);
        toast({
          variant: "destructive",
          title: "Oh, nu! Ceva nu a funcționat.",
          description: "Nu am putut programa consultația. Vă rugăm să încercați din nou.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getFullDateTime = (time: string, baseDate: Date | undefined): Date => {
    if (!baseDate) return new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  if (isConfirmed) {
    const fullDateTime = getFullDateTime(selectedTime!, date);
    return (
      <div className="container py-24 sm:py-32">
        <Alert variant="default" className="max-w-2xl mx-auto border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Programare Confirmată!</AlertTitle>
          <AlertDescription>
            Consultația dvs. este programată pentru {format(fullDateTime, "PPP 'la' p")}.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-24 sm:py-32">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Programează o Consultație
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80">
          Alegeți o dată și o oră convenabilă pentru dvs. Așteptăm cu nerăbdare să discutăm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mt-16 max-w-6xl mx-auto">
        <Card className="flex flex-col">
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-primary font-headline">
               <CalendarIcon className="h-5 w-5" />
               1. Selectați o Dată
             </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center flex-grow">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                setSelectedTime(null);
              }}
              disabled={(d) => isPast(d) && !isToday(d)}
              className="p-0"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary font-headline">
              <Clock className="h-5 w-5" />
              2. Selectați o Oră
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-1">{date ? format(date, 'EEEE, d MMMM') : 'Vă rugăm selectați o zi'}</p>
          </CardHeader>
          <CardContent>
             {isLoadingSchedule ? (
                <div className="grid grid-cols-3 gap-2">
                    {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
             ): (
                <>
                {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableTimes.map((time) => {
                            const fullDateTime = getFullDateTime(time, date);
                            const isTimePast = date && isToday(date) ? isPast(fullDateTime) : false;
                            const isBooked = blockedSlots.has(time);

                            return (
                                <Button
                                    key={time}
                                    variant={selectedTime === time ? "default" : "outline"}
                                    onClick={() => setSelectedTime(time)}
                                    disabled={!date || isTimePast || isBooked}
                                    className={cn(selectedTime === time && "bg-primary text-primary-foreground")}
                                >
                                    {time}
                                </Button>
                            );
                        })}
                    </div>
                ) : (
                    <Alert variant="default" className="border-amber-500 text-amber-700">
                        <AlertCircle className="h-4 w-4 !text-amber-600" />
                        <AlertTitle>Niciun interval orar disponibil</AlertTitle>
                        <AlertDescription>
                            Administratorul nu a configurat încă orele disponibile pentru programări.
                        </AlertDescription>
                    </Alert>
                )}
                </>
             )}
          </CardContent>
        </Card>
      </div>

      {date && selectedTime && (
        <div className="max-w-3xl mx-auto mt-12">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-primary">3. Informațiile Dvs.</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">
                        Pentru programarea dvs. din {format(date, 'PPP')} la ora {selectedTime}.
                    </p>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nume Complet</FormLabel>
                            <FormControl>
                                <Input placeholder="Ion Popescu" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Adresă de Email</FormLabel>
                                <FormControl>
                                <Input placeholder="ion.popescu@exemplu.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Număr de Telefon</FormLabel>
                                <FormControl>
                                <Input placeholder="(+40) 712 345 678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                        <FormField
                        control={form.control}
                        name="issue"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descrieți pe scurt problema dvs. juridică</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Spuneți-ne puțin despre motivul pentru care ne contactați..."
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Se programează...' : 'Programează Consultația'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

    