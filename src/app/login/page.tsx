'use client';

import { useState } from 'react';
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
import { useAuth } from '@/firebase';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'Vă rugăm să introduceți un email valid.' }),
  password: z.string().min(6, { message: 'Parola trebuie să aibă cel puțin 6 caractere.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const handlePasswordReset = async () => {
    const email = form.getValues('email');
    if (!email) {
      form.setError('email', {
        type: 'manual',
        message: 'Vă rugăm să introduceți adresa de email pentru a reseta parola.',
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Email de resetare trimis',
        description: 'Verificați-vă inbox-ul pentru a vă reseta parola.',
      });
    } catch (error: any) {
      console.error('Eroare la resetarea parolei:', error);
      toast({
        variant: 'destructive',
        title: 'Eroare',
        description: error.message || 'Nu am putut trimite emailul de resetare. Vă rugăm să încercați din nou.',
      });
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    signInWithEmailAndPassword(auth, data.email, data.password)
      .then(() => {
        toast({
          title: 'Autentificare reușită',
          description: 'Bine ați revenit.',
        });
        router.push('/admin');
      })
      .catch((error: any) => {
        console.error('Eroare la autentificare:', error);
        toast({
          variant: 'destructive',
          title: 'Eroare de autentificare',
          description: error.message || 'Date de identificare incorecte. Vă rugăm să încercați din nou.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            Autentificare Administrator
          </CardTitle>
          <CardDescription>
            Introduceți datele de autentificare pentru a accesa panoul de administrare.
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
                        placeholder="admin@avocatlaw.com"
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
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Autentificare...' : 'Autentificare'}
              </Button>
               <Button
                variant="link"
                type="button"
                className="text-sm font-medium text-muted-foreground"
                onClick={handlePasswordReset}
              >
                Ați uitat parola?
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
