'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BlogPostSchema } from '@/lib/schemas';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type BlogPostFormData = {
    title: string;
    excerpt: string;
    imageUrl: string;
    content: string;
};

export default function EditBlogPostPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { toast } = useToast();

    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    
    const [isSaving, setIsSaving] = useState(false);
    const [postId, setPostId] = useState<string | null>(null);

    // --- Data Fetching ---
    const adminRoleRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);
    const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
    const isUserAdmin = adminRole?.isAdmin === true;

    const postQuery = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'blog_posts'), where('slug', '==', slug));
    }, [firestore, slug]);
    const { data: postData, isLoading: isPostLoading } = useCollection(postQuery);
    
    // --- Form Handling ---
    const form = useForm<BlogPostFormData>({
        resolver: zodResolver(BlogPostSchema),
        defaultValues: {
            title: '',
            excerpt: '',
            imageUrl: '',
            content: '',
        }
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        if (postData && postData.length > 0) {
            const post = postData[0];
            setPostId(post.id);
            form.reset({
                title: post.title,
                excerpt: post.excerpt,
                imageUrl: post.imageUrl,
                content: Array.isArray(post.content) ? post.content.join('\n\n') : post.content,
            });
        }
    }, [postData, form]);

    const onSubmit = (data: BlogPostFormData) => {
        if (!firestore || !postId) return;
        setIsSaving(true);
        
        const postRef = doc(firestore, 'blog_posts', postId);
        const updatedData = {
            ...data,
            content: data.content.split('\n\n'), // Split content back into an array of paragraphs
        };

        updateDocumentNonBlocking(postRef, updatedData);

        toast({
            title: 'Articol Actualizat',
            description: 'Modificările au fost salvate cu succes.',
        });
        setIsSaving(false);
        router.push(`/blog/${slug}`);
    };
    
    const isLoading = isPostLoading || isUserLoading || isLoadingRole;

    if (isLoading) {
        return (
            <div className="container py-12">
                <Skeleton className="h-10 w-48 mb-8" />
                <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-64 w-full"/></CardContent></Card>
            </div>
        );
    }
    
    if (!isUserAdmin) {
         return (
            <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 text-center">
                <div>
                    <h2 className="font-headline text-2xl font-bold text-destructive">Acces Interzis</h2>
                    <p className="mt-2 text-muted-foreground">Nu aveți permisiuni pentru a edita acest articol.</p>
                </div>
            </div>
        );
    }
    
     if (!postData || postData.length === 0) {
        return (
            <div className="container py-24 sm:py-32 text-center">
                <h1 className="text-2xl font-bold">Articolul nu a fost găsit</h1>
            </div>
        );
    }


    return (
        <div className="container py-12">
            <div className="flex items-center gap-4 mb-8">
                 <Button variant="outline" size="icon" asChild>
                    <Link href={`/blog/${slug}`}><ArrowLeft /></Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    Editare Articol Blog
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
                            <Input id="title" {...form.register('title')} />
                             {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="excerpt">Extras (Rezumat)</Label>
                            <Textarea id="excerpt" {...form.register('excerpt')} rows={3} />
                            {form.formState.errors.excerpt && <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="imageUrl">URL Imagine</Label>
                            <Input id="imageUrl" {...form.register('imageUrl')} />
                            {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Conținut Complet</Label>
                            <Textarea id="content" {...form.register('content')} rows={15} />
                             <p className="text-sm text-muted-foreground">Separați paragrafele cu două linii goale (apăsând Enter de două ori).</p>
                             {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? 'Se salvează...' : 'Salvează Modificările'}
                        </Button>
                    </CardFooter>
                 </Card>
            </form>
        </div>
    );
}

    