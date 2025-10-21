'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Newspaper, PlusCircle, ArrowLeft, Trash2, PenSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export default function AdminBlogPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
  
  const isUserAdmin = adminRole?.isAdmin === true;

  const blogPostsQuery = useMemoFirebase(() => {
    if (!firestore || !isUserAdmin) return null;
    return query(collection(firestore, 'blog_posts'), orderBy('date', 'desc'));
  }, [firestore, isUserAdmin]);

  const { data: blogPosts, isLoading: isLoadingPosts } = useCollection(blogPostsQuery);

  const handleDelete = (postId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'blog_posts', postId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: 'Articol Șters',
        description: `Articolul a fost șters cu succes.`,
    });
  };

  if (isUserLoading || isLoadingRole) {
    return (
      <div className="container py-12">
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }
  
  if (!isUserAdmin) {
     return (
      <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 text-center">
        <div>
          <h2 className="font-headline text-2xl font-bold text-destructive">Acces Interzis</h2>
          <p className="mt-2 text-muted-foreground">
            Nu aveți permisiuni de administrator pentru a vizualiza această pagină.
          </p>
           <Button asChild className="mt-4">
            <Link href="/">Înapoi la Acasă</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin"><ArrowLeft /></Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    Gestionare Blog
                </h1>
            </div>
            <Button asChild>
                <Link href="/admin/blog/create"><PlusCircle /> Creează Articol Nou</Link>
            </Button>
        </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Newspaper /> Articole Publicate</CardTitle>
          <CardDescription>Aici puteți vedea, edita sau șterge articolele de pe blog.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPosts ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : blogPosts && blogPosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titlu</TableHead>
                  <TableHead>Data Publicării</TableHead>
                  <TableHead>Slug (URL)</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogPosts.map((post: any) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.date}</TableCell>
                    <TableCell className="text-muted-foreground">{post.slug}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/blog/edit/${post.slug}`}><PenSquare/> Editează</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 /> Șterge
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Această acțiune nu poate fi anulată. Aceasta va șterge permanent articolul.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(post.id)}>
                              Șterge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Nu există articole de blog publicate.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/blog/create">Creează Primul Articol</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
