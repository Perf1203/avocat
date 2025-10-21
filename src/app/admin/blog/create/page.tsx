'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BlogPostSchema } from '@/lib/schemas';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

type BlogPostFormData = {
    title: string;
    excerpt: string;
    imageUrl: string;
    content: string;
};

// Function to generate a URL-friendly slug
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

export default function CreateBlogPostPage() {
    const router = useRouter();
    const { toast } = useToast();

    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<BlogPostFormData>({
        resolver: zodResolver(BlogPostSchema),
        defaultValues: {
            title: '',
            excerpt: '',
            imageUrl: '',
            content: '',
        }
    });

    const onSubmit = (data: BlogPostFormData) => {
        if (!firestore) return;
        setIsSaving(true);
        
        const postsCollection = collection(firestore, 'blog_posts');
        const newPostData = {
            ...data,
            slug: generateSlug(data.title),
            content: data.content.split('\n\n'), // Split content into an array of paragraphs
            date: format(new Date(), 'dd MMMM yyyy'),
        };

        addDocumentNonBlocking(postsCollection, newPostData)
          .then((docRef) => {
            toast({
                title: 'Articol Creat',
                description: 'Noul articol de blog a fost adăugat cu succes.',
            });
            setIsSaving(false);
            router.push(`/admin/blog`);
          })
          .catch((error) => {
             toast({
                title: 'Eroare',
                description: 'A apărut o eroare la crearea articolului.',
                variant: 'destructive',
            });
            setIsSaving(false);
          });
    };
    
    if (isUserLoading) {
        return <div className="container py-12"><p>Loading...</p></div>
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="container py-12">
            <div className="flex items-center gap-4 mb-8">
                 <Button variant="outline" size="icon" asChild>
                    <Link href={`/admin/blog`}><ArrowLeft /></Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    Articol Nou
                </h1>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)}>
                 <Card>
                    <CardHeader>
                        <CardTitle>Conținut Articol</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titlu</Label>
                            <Input id="title" {...form.register('title')} placeholder="Titlul articolului..."/>
                             {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="excerpt">Extras (Rezumat)</Label>
                            <Textarea id="excerpt" {...form.register('excerpt')} rows={3} placeholder="Un scurt rezumat al articolului..."/>
                            {form.formState.errors.excerpt && <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="imageUrl">URL Imagine</Label>
                            <Input id="imageUrl" {...form.register('imageUrl')} placeholder="https://..."/>
                            {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Conținut Complet</Label>
                            <Textarea id="content" {...form.register('content')} rows={15} placeholder="Scrieți conținutul complet aici..."/>
                             <p className="text-sm text-muted-foreground">Separați paragrafele cu două linii goale (apăsând Enter de două ori).</p>
                             {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? 'Se publică...' : 'Publică Articolul'}
                        </Button>
                    </CardFooter>
                 </Card>
            </form>
        </div>
    );
}
