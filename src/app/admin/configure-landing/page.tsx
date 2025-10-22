
'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Wand2, PlusCircle, Edit, Trash2, type LucideIcon, Gavel, BookOpen, PenSquare, Scale, Landmark, Shield, Briefcase, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { ContentSuggestionTool } from '@/components/content-suggestion-tool';
import { TestimonialDialog } from '@/components/testimonial-dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PriceDialog } from '@/components/price-dialog';
import { PracticeAreaDialog } from '@/components/practice-area-dialog';
import * as LucideIcons from 'lucide-react';

const iconMap: { [key: string]: LucideIcon } = {
    Gavel,
    BookOpen,
    PenSquare,
    Scale,
    Landmark,
    Shield,
    Briefcase,
    FileText,
};

const AreaIcon = ({ name = 'Gavel' }: { name?: string }) => {
    const Icon = iconMap[name] || Gavel;
    return <Icon className="h-5 w-5 text-primary" />;
};


export default function ConfigureLandingPage() {
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState<any>({});
    const [showSuggestionTool, setShowSuggestionTool] = useState(false);
    
    // Dialog States
    const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
    const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<any>(null);
    const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<any>(null);

    const adminRoleRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);

    const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
    const isUserAdmin = adminRole?.isAdmin === true;

    // Data Collections
    const contentCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "landing_page_content") : null, [firestore]);
    const { data: contentData, isLoading: isContentLoading } = useCollection(contentCollectionRef);
    
    const testimonialsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "testimonials") : null, [firestore]);
    const { data: testimonialsData, isLoading: areTestimonialsLoading } = useCollection(testimonialsCollectionRef);

    const pricesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "consultation_prices") : null, [firestore]);
    const { data: pricesData, isLoading: arePricesLoading } = useCollection(pricesCollectionRef);

    const practiceAreasCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'practice_areas') : null, [firestore]);
    const { data: practiceAreasData, isLoading: arePracticeAreasLoading } = useCollection(practiceAreasCollectionRef);

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

    const handleSaveGeneric = (collectionName: string, data: any, editingItem: any | null, successMessage: string) => {
        if (!firestore) return;
    
        if (editingItem) {
            const docRef = doc(firestore, collectionName, editingItem.id);
            updateDocumentNonBlocking(docRef, data);
            toast({ title: `${successMessage} Actualizat`, description: "Modificările au fost salvate." });
        } else {
            const collectionRef = collection(firestore, collectionName);
            addDocumentNonBlocking(collectionRef, data);
            toast({ title: `${successMessage} Adăugat`, description: `Noul element a fost adăugat.` });
        }
    };
    
    const handleDeleteGeneric = (collectionName: string, itemId: string, successMessage: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, collectionName, itemId);
        deleteDocumentNonBlocking(docRef);
        toast({ title: `${successMessage} Șters`, description: 'Elementul a fost șters.' });
    };

    const handleApplySuggestion = (suggestion: any) => {
        const { suggestedHeadline, suggestedBodyText, suggestedCallToAction } = suggestion;
        if (suggestedHeadline) handleInputChange('hero', 'headline', suggestedHeadline);
        if (suggestedBodyText) handleInputChange('hero', 'bodyText', suggestedBodyText);
        if (suggestedCallToAction) handleInputChange('hero', 'callToActionText', suggestedCallToAction);
    };

    const totalLoading = isLoading || isUserLoading || isLoadingRole || areTestimonialsLoading || arePricesLoading || arePracticeAreasLoading;

    if (totalLoading) {
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
                
                {/* Practice Areas Section */}
                <AccordionItem value="item-6">
                    <AccordionTrigger className="text-xl font-headline bg-muted px-4 rounded-t-lg">Servicii (Arii de Practică)</AccordionTrigger>
                    <AccordionContent className="p-0">
                        <Card className="rounded-t-none">
                            <CardHeader>
                                <CardTitle>Gestionare Servicii</CardTitle>
                                <CardDescription>Adăugați, editați sau ștergeți ariile de practică afișate pe pagina principală.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.isArray(practiceAreasData) && practiceAreasData.map((area: any) => (
                                    <Card key={area.id} className="flex items-center gap-4 p-4">
                                        <AreaIcon name={area.icon} />
                                        <div className="flex-1">
                                            <p className="font-semibold">{area.title}</p>
                                            <p className="text-sm text-foreground/80">{area.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingArea(area); setIsAreaDialogOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Sunteți sigur?</AlertDialogTitle>
                                                        <AlertDialogDescription>Această acțiune va șterge permanent acest serviciu.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteGeneric('practice_areas', area.id, 'Serviciu')}>Șterge</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </Card>
                                ))}
                            </CardContent>
                            <CardFooter className="flex justify-center border-t pt-4">
                                <Button variant="outline" onClick={() => { setEditingArea(null); setIsAreaDialogOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adaugă Serviciu Nou
                                </Button>
                            </CardFooter>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                 {/* Testimonials Section */}
                <AccordionItem value="item-5">
                    <AccordionTrigger className="text-xl font-headline bg-muted px-4 rounded-t-lg">Testimoniale</AccordionTrigger>
                    <AccordionContent className="p-0">
                        <Card className="rounded-t-none">
                            <CardHeader>
                                <CardTitle>Gestionare Testimoniale</CardTitle>
                                <CardDescription>Adăugați, editați sau ștergeți testimonialele afișate pe pagina principală.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.isArray(testimonialsData) && testimonialsData.map((testimonial: any) => (
                                    <Card key={testimonial.id} className="flex items-start gap-4 p-4">
                                        <Avatar>
                                            <AvatarImage src={testimonial.avatarUrl} />
                                            <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-semibold">{testimonial.author} - <span className="text-sm text-muted-foreground">{testimonial.title}</span></p>
                                            <p className="text-sm italic text-foreground/80">"{testimonial.quote}"</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingTestimonial(testimonial); setIsTestimonialDialogOpen(true);}}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Sunteți sigur?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Această acțiune nu poate fi anulată. Testimonialul va fi șters permanent.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteGeneric('testimonials', testimonial.id, 'Testimonial')}>
                                                            Șterge
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </Card>
                                ))}
                            </CardContent>
                            <CardFooter className="flex justify-center border-t pt-4">
                                <Button variant="outline" onClick={() => { setEditingTestimonial(null); setIsTestimonialDialogOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adaugă Testimonial Nou
                                </Button>
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
                                <CardTitle>Gestionare Planuri de Prețuri</CardTitle>
                                <CardDescription>Adăugați, editați sau ștergeți planurile de prețuri afișate pe pagina principală.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               {Array.isArray(pricesData) && pricesData.map((price: any) => (
                                    <Card key={price.id} className="flex items-center gap-4 p-4">
                                        <div className="flex-1">
                                            <p className="font-semibold">{price.title} - 
                                                <span className="text-sm font-bold text-primary ml-2">
                                                    {price.type === 'flat' ? `${price.flatRate} €` : `${price.pricePerHour} €/oră`}
                                                </span>
                                            </p>
                                            <p className="text-sm text-foreground/80">{price.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingPrice(price); setIsPriceDialogOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Sunteți sigur?</AlertDialogTitle>
                                                        <AlertDialogDescription>Această acțiune va șterge permanent acest plan de preț.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteGeneric('consultation_prices', price.id, 'Plan de preț')}>Șterge</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </Card>
                                ))}
                            </CardContent>
                             <CardFooter className="flex justify-center border-t pt-4">
                                <Button variant="outline" onClick={() => { setEditingPrice(null); setIsPriceDialogOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adaugă Plan de Preț
                                </Button>
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
            <TestimonialDialog
                isOpen={isTestimonialDialogOpen}
                onOpenChange={setIsTestimonialDialogOpen}
                testimonial={editingTestimonial}
                onSave={(data) => {
                    handleSaveGeneric('testimonials', data, editingTestimonial, 'Testimonial');
                    setIsTestimonialDialogOpen(false);
                }}
            />
             <PriceDialog
                isOpen={isPriceDialogOpen}
                onOpenChange={setIsPriceDialogOpen}
                price={editingPrice}
                onSave={(data) => {
                    handleSaveGeneric('consultation_prices', data, editingPrice, 'Plan de preț');
                    setIsPriceDialogOpen(false);
                }}
            />
            <PracticeAreaDialog
                isOpen={isAreaDialogOpen}
                onOpenChange={setIsAreaDialogOpen}
                area={editingArea}
                onSave={(data) => {
                    handleSaveGeneric('practice_areas', data, editingArea, 'Serviciu');
                    setIsAreaDialogOpen(false);
                }}
            />
        </div>
    );
}

  
