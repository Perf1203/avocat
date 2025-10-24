'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { updateProfile, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, User, Image as ImageIcon, Lock, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { profileSchema, photoSchema, emailSchema } from '@/lib/schemas';

type ProfileFormValues = z.infer<typeof profileSchema>;
type PhotoFormValues = z.infer<typeof photoSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;

export default function AdminProfilePage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
    },
  });

  const photoForm = useForm<PhotoFormValues>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      photoURL: '',
    },
  });
  
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (user) {
      profileForm.setValue('displayName', user.displayName || '');
      photoForm.setValue('photoURL', user.photoURL || '');
      emailForm.setValue('newEmail', user.email || '');
    }
  }, [user, isUserLoading, router, profileForm, photoForm, emailForm]);

  const onUpdateName = async (data: ProfileFormValues) => {
    if (!auth.currentUser) return;
    setIsSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
      toast({ title: 'Nume Actualizat', description: 'Numele dvs. a fost actualizat cu succes.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Eroare', description: error.message });
    } finally {
      setIsSavingName(false);
    }
  };

  const onUpdatePhoto = async (data: PhotoFormValues) => {
    if (!auth.currentUser) return;
    setIsSavingPhoto(true);
    try {
      await updateProfile(auth.currentUser, { photoURL: data.photoURL });
      toast({ title: 'Fotografie Actualizată', description: 'Fotografia de profil a fost actualizată.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Eroare', description: error.message });
    } finally {
      setIsSavingPhoto(false);
    }
  };
  
   const onUpdateEmail = async (data: EmailFormValues) => {
    if (!auth.currentUser || !user?.email) return;

    setIsSavingEmail(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, data.password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await verifyBeforeUpdateEmail(auth.currentUser, data.newEmail);
      toast({ 
        title: 'Email de Verificare Trimis', 
        description: 'Verificați noul email pentru a finaliza modificarea.' 
      });
      emailForm.reset({ newEmail: data.newEmail, password: '' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Eroare la actualizarea email-ului',
        description: error.code === 'auth/wrong-password' 
            ? 'Parola introdusă este incorectă.'
            : 'A apărut o eroare. Vă rugăm să încercați din nou.',
      });
    } finally {
      setIsSavingEmail(false);
    }
  };
  
  const onResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: 'Email Trimis', description: 'Verificați email-ul pentru a reseta parola.' });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Eroare', description: error.message });
    }
  }

  if (isUserLoading) {
    return <div className="container py-12"><Skeleton className="h-64 w-full max-w-2xl mx-auto" /></div>;
  }

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin"><ArrowLeft /></Link>
        </Button>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Profil Administrator
        </h1>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <User className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <CardTitle>Actualizare Nume</CardTitle>
              <CardDescription>Modificați numele afișat în aplicație.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={profileForm.handleSubmit(onUpdateName)}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nume</Label>
                <Input id="displayName" {...profileForm.register('displayName')} />
                {profileForm.formState.errors.displayName && <p className="text-sm text-destructive">{profileForm.formState.errors.displayName.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSavingName}>
                {isSavingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvează Nume
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <ImageIcon className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <CardTitle>Schimbă Fotografia de Profil</CardTitle>
              <CardDescription>Actualizați fotografia de profil folosind un URL.</CardDescription>
            </div>
          </CardHeader>
           <form onSubmit={photoForm.handleSubmit(onUpdatePhoto)}>
            <CardContent className="space-y-4">
                <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Admin'} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
              <div className="space-y-2">
                <Label htmlFor="photoURL">URL Fotografie</Label>
                <Input id="photoURL" {...photoForm.register('photoURL')} placeholder="https://exemplu.com/imagine.png" />
                {photoForm.formState.errors.photoURL && <p className="text-sm text-destructive">{photoForm.formState.errors.photoURL.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
               <Button type="submit" disabled={isSavingPhoto}>
                {isSavingPhoto && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvează Fotografia
              </Button>
            </CardFooter>
           </form>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Mail className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <CardTitle>Schimbă Adresa de Email</CardTitle>
              <CardDescription>Actualizați adresa de email. Va trebui să confirmați parola.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={emailForm.handleSubmit(onUpdateEmail)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email Nou</Label>
                <Input id="newEmail" type="email" {...emailForm.register('newEmail')} />
                {emailForm.formState.errors.newEmail && <p className="text-sm text-destructive">{emailForm.formState.errors.newEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parola Curentă</Label>
                <Input id="password" type="password" {...emailForm.register('password')} placeholder="Introduceți parola pentru a confirma"/>
                {emailForm.formState.errors.password && <p className="text-sm text-destructive">{emailForm.formState.errors.password.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSavingEmail}>
                {isSavingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvează Email
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
           <CardHeader className="flex flex-row items-center gap-4">
             <Lock className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <CardTitle>Schimbă Parola</CardTitle>
              <CardDescription>Veți primi un email cu instrucțiuni pentru a reseta parola.</CardDescription>
            </div>
           </CardHeader>
           <CardFooter className="flex justify-end">
            <Button onClick={onResetPassword}>Trimite Email de Resetare</Button>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
