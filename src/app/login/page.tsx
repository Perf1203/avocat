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
import { useAuth, FirestorePermissionError, errorEmitter } from '@/firebase';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor ingrese un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
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

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    signInWithEmailAndPassword(auth, data.email, data.password)
      .then(() => {
        toast({
          title: 'Inicio de sesión exitoso',
          description: 'Bienvenido de nuevo.',
        });
        router.push('/admin');
      })
      .catch((error: any) => {
        console.error('Error al iniciar sesión:', error);
        toast({
          variant: 'destructive',
          title: 'Error de inicio de sesión',
          description: error.message || 'Credenciales incorrectas. Por favor, inténtelo de nuevo.',
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
            Inicio de Sesión de Administrador
          </CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al panel de administración.
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
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@argoslaw.com"
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
                    <FormLabel>Contraseña</FormLabel>
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
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Regístrate
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
