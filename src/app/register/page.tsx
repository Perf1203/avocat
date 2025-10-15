'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { RegistrationSchema } from '@/lib/schemas';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistrationAllowed, setIsRegistrationAllowed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const registrationSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'registration');
  }, [firestore]);

  const { data: registrationSettings, isLoading: isLoadingSettings } = useDoc(registrationSettingsRef);

  useEffect(() => {
    if (!isLoadingSettings) {
      if (registrationSettings?.isPublicRegistrationOpen) {
        setIsRegistrationAllowed(true);
      } else {
        setIsRegistrationAllowed(false);
      }
      setIsChecking(false);
    }
  }, [registrationSettings, isLoadingSettings]);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsLoading(true);
    createUserWithEmailAndPassword(auth, data.email, data.password)
      .then((userCredential) => {
        toast({
          title: 'Cont creat cu succes',
          description: 'Ați fost autentificat.',
        });
        // Redirect to a dashboard or home page after registration
        router.push('/');
      })
      .catch((error: any) => {
        console.error('Eroare la creare cont:', error);
        toast({
          variant: 'destructive',
          title: 'Eroare la creare cont',
          description: error.message || 'Nu am putut crea contul. Vă rugăm să încercați din nou.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (isChecking) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isRegistrationAllowed) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 text-center">
        <div>
          <h2 className="font-headline text-2xl font-bold text-destructive">Înregistrare Dezactivată</h2>
          <p className="mt-2 text-muted-foreground">
            Crearea de noi conturi este momentan dezactivată de către administrator.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Înapoi la Acasă</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            Creare Cont Nou
          </CardTitle>
          <CardDescription>
            Completați detaliile de mai jos pentru a vă crea un cont.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresă de Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="utilizator@exemplu.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parolă</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmare Parolă</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Se creează contul...' : 'Creare Cont'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Aveți deja un cont?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Autentificare
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
