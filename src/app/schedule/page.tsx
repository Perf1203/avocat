"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { add, format, isPast, isToday, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";

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

type AppointmentFormData = z.infer<typeof AppointmentSchema>;

const availableTimes = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
];

export default function SchedulePage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      issue: "",
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    console.log("Appointment Booked:", { ...data, date, time: selectedTime });
    setIsConfirmed(true);
    toast({
      title: "Appointment Confirmed!",
      description: `Your consultation is set for ${format(date!, "PPP")} at ${selectedTime}.`,
    });
  };

  const getFullDateTime = (time: string): Date => {
    if (!date) return new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  if (isConfirmed) {
    return (
      <div className="container py-24 sm:py-32">
        <Alert variant="default" className="max-w-2xl mx-auto border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Appointment Confirmed!</AlertTitle>
          <AlertDescription>
            Your consultation is booked for {format(date!, "PPP")} at {selectedTime}. You will receive a confirmation email shortly.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-24 sm:py-32">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Schedule a Consultation
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80">
          Choose a date and time that works for you. We look forward to speaking with you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mt-16 max-w-6xl mx-auto">
        <Card className="flex flex-col">
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-primary font-headline">
               <CalendarIcon className="h-5 w-5" />
               1. Select a Date
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
              2. Select a Time
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-1">{date ? format(date, 'EEEE, MMMM d') : 'Please select a day'}</p>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTimes.map((time) => {
                    const fullDateTime = getFullDateTime(time);
                    const isTimePast = isPast(fullDateTime);
                    return (
                        <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            onClick={() => setSelectedTime(time)}
                            disabled={!date || isTimePast}
                            className={cn(selectedTime === time && "bg-primary text-primary-foreground")}
                        >
                            {time}
                        </Button>
                    );
                })}
             </div>
          </CardContent>
        </Card>
      </div>

      {date && selectedTime && (
        <div className="max-w-3xl mx-auto mt-12">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-primary">3. Your Information</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">
                        For your appointment on {format(date, 'PPP')} at {selectedTime}.
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
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
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
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                <Input placeholder="john.doe@example.com" {...field} />
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
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} />
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
                            <FormLabel>Briefly describe your legal issue</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Tell us a little about why you're reaching out..."
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" size="lg" className="w-full">
                        Book Appointment
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
