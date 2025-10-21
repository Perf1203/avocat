
'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { ContentSuggestionTool } from '@/components/content-suggestion-tool';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"


export default function ConfigureLandingPage() {
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState<any>({});
    const [showSuggestionTool, setShowSuggestionTool] = useState(false);

    const adminRoleRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);

    const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
    const isUserAdmin = adminRole?.isAdmin === true;

    const contentCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "landing_page_content") : null, [firestore]);
    const { data: contentData, isLoading: isContentLoading } = useCollection(contentCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        if (contentData) {
            const newContent: any = {};
            (contentData as any[]).forEach(doc => {
                newContent[doc.id] = doc;
            });
            setContent(newContent);
        }
        if(!isContentLoading) {
            setIsLoading(false);
        }
    }, [contentData, isContentLoading]);
    
    const handleInputChange = (section: string, field: string, value: string | number) => {
        setContent(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    }

    const handleSaveSection = (sectionId: string) => {
        if (!firestore) return;
        const sectionData = content[sectionId];
        if (!sectionData) return;

        const docRef = doc(firestore, 'landing_page_content', sectionId);
        setDocumentNonBlocking(docRef, { ...sectionData, sectionName: sectionId }, { merge: true });
        
        toast({
            title: "Secțiune Salvată",
            description: `Conținutul pentru secțiunea "${sectionId}" a fost actualizat.`
        });
    }

    const handleApplySuggestion = (suggestion: any) => {
        const { suggestedHeadline, suggestedBodyText, suggestedCallToAction } = suggestion;
        if (suggestedHeadline) handleInputChange('hero', 'headline', suggestedHeadline);
        if (suggestedBodyText) handleInputChange('hero', 'bodyText', suggestedBodyText);
        if (suggestedCallToAction) handleInputChange('hero', 'callToActionText', suggestedCallToAction);
    };

    if (isLoading || isUserLoading || isLoadingRole) {
        return (
            <div className="container py-12">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
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
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin"><ArrowLeft /></Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    Configurează Pagina Principală
                </h1>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
                {/* Hero Section */}
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl font-headline bg-muted px-4 rounded-t-lg">Secțiune Principală (Hero)</AccordionTrigger>
                    <AccordionContent className="p-0">
                        <Card className="rounded-t-none">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="hero-headline">Titlu Principal</Label>
                                    <Input id="hero-headline" value={content.hero?.headline || ''} onChange={(e) => handleInputChange('hero', 'headline', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="hero-body">Text Principal</Label>
                                    <Textarea id="hero-body" value={content.hero?.bodyText || ''} onChange={(e) => handleInputChange('hero', 'bodyText', e.target.value)} rows={3}/>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="hero-cta">Text Buton Acțiune</Label>
                                    <Input id="hero-cta" value={content.hero?.callToActionText || ''} onChange={(e) => handleInputChange('hero', 'callToActionText', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="hero-image">URL Imagine</Label>
                                    <Input id="hero-image" value={content.hero?.imageUrl || ''} onChange={(e) => handleInputChange('hero', 'imageUrl', e.target.value)} />
                                </div>
                            </CardContent>
                             <CardFooter className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => setShowSuggestionTool(true)}>
                                    <Wand2 className="mr-2 h-4 w-4" /> Sugerează cu AI
                                </Button>
                                <Button onClick={() => handleSaveSection('hero')}>Salvează Secțiunea</Button>
                            </CardFooter>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                 {/* About Section */}
                 <AccordionItem value="item-2">
                    <AccordionTrigger className="text-xl font-headline bg-muted px-4 rounded-t-lg">Secțiune "Despre Noi"</AccordionTrigger>
                    <AccordionContent className="p-0">
                        <Card className="rounded-t-none">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="about-title">Titlu</Label>
                                    <Input id="about-title" value={content.about?.title || ''} onChange={(e) => handleInputChange('about', 'title', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="about-text1">Paragraf 1</Label>
                                    <Textarea id="about-text1" value={content.about?.text1 || ''} onChange={(e) => handleInputChange('about', 'text1', e.target.value)} rows={4}/>
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="about-text2">Paragraf 2</Label>
                                    <Textarea id="about-text2" value={content.about?.text2 || ''} onChange={(e) => handleInputChange('about', 'text2', e.target.value)} rows={3}/>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="about-cta">Text Buton</Label>
                                    <Input id="about-cta" value={content.about?.callToActionText || ''} onChange={(e) => handleInputChange('about', 'callToActionText', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="about-image">URL Imagine</Label>
                                    <Input id="about-image" value={content.about?.imageUrl || ''} onChange={(e) => handleInputChange('about', 'imageUrl', e.target.value)} />
                                </div>
                            </CardContent>
                             <CardFooter className="flex justify-end">
                                <Button onClick={() => handleSaveSection('about')}>Salvează Secțiunea</Button>
                            </CardFooter>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
                
                 {/* Pricing Section */}
                <AccordionItem value="item-3">
                    <AccordionTrigger className="text-xl font-headline bg-muted px-4 rounded-t-lg">Secțiune Prețuri</AccordionTrigger>
                    <AccordionContent className="p-0">
                         <Card className="rounded-t-none">
                            <CardHeader>
                                <CardTitle>Prețuri Consultații</CardTitle>
                                <CardDescription>Editează planurile de prețuri afișate pe pagina principală. Lasă un câmp gol pentru a nu-l afișa.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {content.prices ? Object.keys(content.prices).map(priceKey => (
                                    <div key={priceKey} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md">
                                        <div className="space-y-1 md:col-span-3">
                                            <Label>Descriere Plan</Label>
                                            <Input value={content.prices[priceKey]?.description || ''} onChange={(e) => handleInputChange('prices', `${priceKey}.description`, e.target.value)} />
                                        </div>
                                         <div className="space-y-1">
                                            <Label>Taxă Unică (€)</Label>
                                            <Input type="number" value={content.prices[priceKey]?.flatRate || ''} onChange={(e) => handleInputChange('prices', `${priceKey}.flatRate`, Number(e.target.value))} />
                                        </div>
                                         <div className="space-y-1">
                                            <Label>Preț pe Oră (€)</Label>
                                            <Input type="number" value={content.prices[priceKey]?.pricePerHour || ''} onChange={(e) => handleInputChange('prices', `${priceKey}.pricePerHour`, Number(e.target.value))} />
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground">Adaugă prețuri din Firestore (colecția `consultation_prices`).</p>
                                )}
                                 <p className="text-sm text-muted-foreground">Pentru a adăuga sau șterge planuri de prețuri, trebuie să editați direct colecția <code className="bg-muted p-1 rounded-sm">consultation_prices</code> din baza de date Firestore.</p>

                            </CardContent>
                             <CardFooter className="flex justify-end">
                                <Button onClick={() => handleSaveSection('pricing_text')}>Salvează Descrierea</Button>
                            </CardFooter>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
                 {/* Contact Section */}
                <AccordionItem value="item-4">
                    <AccordionTrigger className="text-xl font-headline bg-muted px-4 rounded-t-lg">Secțiune Contact</AccordionTrigger>
                    <AccordionContent className="p-0">
                        <Card className="rounded-t-none">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="contact-title">Titlu</Label>
                                    <Input id="contact-title" value={content.contact?.title || ''} onChange={(e) => handleInputChange('contact', 'title', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="contact-text">Text Introductiv</Label>
                                    <Textarea id="contact-text" value={content.contact?.text || ''} onChange={(e) => handleInputChange('contact', 'text', e.target.value)} rows={3}/>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="contact-address">Adresă</Label>
                                    <Input id="contact-address" value={content.contact?.address || ''} onChange={(e) => handleInputChange('contact', 'address', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="contact-phone">Telefon</Label>
                                    <Input id="contact-phone" value={content.contact?.phone || ''} onChange={(e) => handleInputChange('contact', 'phone', e.target.value)} />
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="contact-email">Email</Label>
                                    <Input id="contact-email" value={content.contact?.email || ''} onChange={(e) => handleInputChange('contact', 'email', e.target.value)} />
                                </div>
                            </CardContent>
                             <CardFooter className="flex justify-end">
                                <Button onClick={() => handleSaveSection('contact')}>Salvează Secțiunea</Button>
                            </CardFooter>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
             <ContentSuggestionTool
                open={showSuggestionTool}
                onOpenChange={setShowSuggestionTool}
                currentContent={{
                    currentHeadline: content.hero?.headline || '',
                    currentBody: content.hero?.bodyText || '',
                    currentCallToAction: content.hero?.callToActionText || '',
                }}
                onApplySuggestion={handleApplySuggestion}
            />
        </div>
    );
}
