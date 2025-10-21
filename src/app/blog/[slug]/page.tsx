
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PenSquare } from 'lucide-react';
import Link from 'next/link';
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export default function BlogPostPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const { firestore } = useFirebase();
    const { user } = useUser();

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
    const post = postData?.[0];

    if (isPostLoading || isLoadingRole) {
        return (
             <div className="container py-24 sm:py-32 max-w-4xl">
                <Skeleton className="h-10 w-48 mb-8" />
                <Skeleton className="h-16 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/4 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                </div>
            </div>
        )
    }

    if (!post && !isPostLoading) {
        return (
            <div className="container py-24 sm:py-32 text-center">
                <h1 className="text-2xl font-bold">Articolul nu a fost găsit</h1>
                <p className="text-muted-foreground mt-2">Nu am putut găsi articolul pe care îl căutați.</p>
                 <Button asChild className="mt-6">
                    <Link href="/">Înapoi la Acasă</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-24 sm:py-32 max-w-4xl relative">
            <Button asChild variant="outline" className="mb-8">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Înapoi la Articole
                </Link>
            </Button>
            <article>
                <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    {post.title}
                </h1>
                <p className="text-muted-foreground mt-4 text-lg">{post.date}</p>
                <div className="prose prose-lg max-w-none mt-8 text-foreground/80">
                    {(post.content as string[]).map((paragraph: string, index: number) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </article>
            {isUserAdmin && (
                <div className="fixed bottom-6 right-6 z-40">
                    <Button asChild variant="secondary">
                        <Link href={`/admin/blog/edit/${post.slug}`}><PenSquare className="mr-2"/> Editează Articolul</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

    