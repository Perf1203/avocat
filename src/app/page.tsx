
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Gavel,
  Landmark,
  BookOpen,
  PenSquare,
  Sparkles,
  Wand2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Users,
  Award,
  MessageCircle,
  Euro,
  FileText,
  Shield,
  Briefcase,
  Scale,
  type LucideIcon,
  Edit,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { collection, doc, query, orderBy, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as LucideIcons from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


// Default Content
const defaultContent = {
    hero: {
        headline: "Expertiză Juridică de Încredere pentru Provocări Moderne",
        bodyText: "Avocat Law oferă servicii juridice de prim rang, adaptate nevoilor dumneavoastră unice. Echipa noastră de avocați cu experiență este dedicată obținerii celor mai bune rezultate posibile pentru clienții noștri prin consiliere strategică și pledoarie neobosită.",
        callToActionText: "Programează o Consultație",
        imageUrl: "https://i.postimg.cc/13Yp8kG1/bermix-studio-a-VCH-3-B-7-E-unsplash.jpg",
        imageHint: "law office"
    },
    about: {
        title: "Angajament, Integritate și Rezultate Excepționale",
        text1: "Fondată pe principiile integrității și excelenței, Avocat Law este mai mult decât un birou de avocatură - suntem partenerii strategici ai clienților noștri. Misiunea noastră este să oferim consiliere juridică clară, pragmatică și adaptată obiectivelor specifice ale fiecărui client.",
        text2: "Cu o echipă de avocați specializați în diverse domenii, de la drept corporativ la litigii complexe, abordăm fiecare caz cu dedicare și o înțelegere profundă a contextului de afaceri.",
        callToActionText: "Află mai mult",
        imageUrl: "https://i.postimg.cc/L5YwdyP4/hunters-race-MYbh-N8-Kaa-Ec-unsplash.jpg",
        imageHint: "lawyers meeting"
    },
    practiceAreas: {
        title: "Domeniile noastre de Practică",
        description: "Oferim rezultate excepționale într-o gamă largă de domenii juridice, asigurând o acoperire completă pentru nevoile clienților noștri.",
    },
    pricing: {
        title: "Consultanță Transparentă",
        description: "Oferim structuri de preț clare și competitive, adaptate nevoilor dumneavoastră.",
    },
    blog: {
        title: "Noutăți & Analize",
        subtitle: "Articole Recente"
    },
    contact: {
        title: "Suntem Aici pentru a Vă Ajuta",
        text: "Fie că aveți o întrebare, doriți să stabiliți o consultație sau aveți nevoie de asistență juridică imediată, echipa noastră este pregătită să vă răspundă.",
        address: "Bulevardul Unirii, Nr. 1, București, România",
        phone: "+40 21 123 4567",
        email: "contact@avocatlaw.ro"
    }
};

const iconMap: { [key: string]: LucideIcon } = {
  Gavel, Landmark, BookOpen, PenSquare, Sparkles, Wand2, Phone, Mail, MapPin, TrendingUp, Users, Award, MessageCircle, Euro, FileText, Scale, Shield, Briefcase,
  ...LucideIcons
};

const AreaIcon = ({ name = 'Gavel' }: { name?: string }) => {
    const IconComponent = (LucideIcons as any)[name] || Gavel;
    return <IconComponent className="h-5 w-5 text-primary" />;
};

const AnimatedSection = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { ref, inView } = useInView({
        triggerOnce: false,
        threshold: 0.1,
    });

    return (
        <div ref={ref} className={cn("transition-all duration-1000", inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10', className)}>
            {children}
        </div>
    );
};

function AnimatedNumber({ value, suffix, duration = 2000 }: { value: number, suffix: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const end = value;
      // Avoid division by zero
      if (end === 0) {
        setCount(0);
        return;
      }
      const incrementTime = (duration / end);

      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [inView, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const StatIcon = ({ name }: { name: string }) => {
    const Icon = iconMap[name];
    return Icon ? <Icon className="h-8 w-8 text-accent" /> : null;
};


export default function Home() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editingStats, setEditingStats] = useState<{[key: string]: number}>({});

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);
  const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
  const isUserAdmin = adminRole?.isAdmin === true;

  const contentCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "landing_page_content") : null, [firestore]);
  const { data: contentData, isLoading: isContentLoading } = useCollection(contentCollectionRef);
  
  const pricesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "consultation_prices") : null, [firestore]);
  const { data: pricesData, isLoading: arePricesLoading } = useCollection(pricesCollectionRef);
  
  const testimonialsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "testimonials") : null, [firestore]);
  const { data: testimonialsData, isLoading: areTestimonialsLoading } = useCollection(testimonialsCollectionRef);

  const practiceAreasCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'practice_areas') : null, [firestore]);
  const { data: practiceAreasData, isLoading: arePracticeAreasLoading } = useCollection(practiceAreasCollectionRef);
  
  const blogPostsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "blog_posts"), orderBy("date", "desc")) : null, [firestore]);
  const { data: blogPosts, isLoading: areBlogPostsLoading } = useCollection(blogPostsQuery);

  const statsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, "stats") : null, [firestore]);
  const { data: statsData, isLoading: areStatsLoading } = useCollection(statsCollectionRef);

  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    if (contentData) {
      const newContent = { ...defaultContent };
      (contentData as any[]).forEach(doc => {
        if (newContent.hasOwnProperty(doc.id as keyof typeof defaultContent)) {
           // @ts-ignore
           newContent[doc.id] = { ...newContent[doc.id], ...doc };
        }
      });
      setContent(newContent);
    }
  }, [contentData]);
  
  const handleStatChange = (id: string, value: string) => {
    const numericValue = parseInt(value, 10);
    setEditingStats(prev => ({
        ...prev,
        [id]: isNaN(numericValue) ? 0 : numericValue
    }));
  };

  const handleSaveStats = async () => {
    if (!firestore) return;
    
    const updates = Object.keys(editingStats).map(id => {
      const statRef = doc(firestore, 'stats', id);
      return setDoc(statRef, { value: editingStats[id] }, { merge: true });
    });

    try {
      await Promise.all(updates);
      toast({
        title: "Statistici Actualizate",
        description: "Valorile au fost salvate cu succes.",
      });
    } catch (error) {
       toast({
        title: "Eroare",
        description: "Nu s-au putut salva statisticile.",
        variant: "destructive"
      });
      console.error("Error saving stats: ", error);
    } finally {
      setIsEditingStats(false);
      setEditingStats({});
    }
  };

  const handleCancelEditStats = () => {
    setIsEditingStats(false);
    setEditingStats({});
  };
  
  const isLoading = isContentLoading || isLoadingRole || areStatsLoading;
  
  const sortedStats = statsData ? [...statsData].sort((a, b) => a.order - b.order) : [];

  return (
    <>
      <div className="relative isolate">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] w-full">
          {isLoading ? (
            <Skeleton className="absolute inset-0" />
          ) : (
            <Image
              src={content.hero.imageUrl}
              alt={content.hero.headline}
              fill
              className="object-cover"
              priority
              data-ai-hint={content.hero.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
          
          <div className="relative container h-full flex flex-col justify-end pb-12 text-left">
            <div className="max-w-2xl">
              {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-12 w-48 mt-4" />
                  </div>
                ) : (
                  <>
                    <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-6xl">
                      {content.hero.headline}
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-foreground/80">
                      {content.hero.bodyText}
                    </p>
                    <div className="mt-10">
                      <Button asChild size="lg">
                        <Link href="/schedule">{content.hero.callToActionText}</Link>
                      </Button>
                    </div>
                  </>
                )}
            </div>
          </div>
          {isUserAdmin && (
            <div className="absolute bottom-6 right-6 z-40">
                <Button asChild variant="secondary">
                    <Link href="/admin/configure-landing"><PenSquare className="mr-2"/> Editează Pagina</Link>
                </Button>
            </div>
          )}
        </section>

        {/* Stats Section */}
        <section className="border-b bg-background py-16 sm:py-20">
            <div className="container">
                <AnimatedSection>
                  <div className="relative">
                    {isUserAdmin && !isEditingStats && (
                         <Button onClick={() => setIsEditingStats(true)} variant="outline" size="sm" className="absolute -top-8 right-0">
                           <Edit className="mr-2 h-4 w-4" /> Editează Statisticile
                         </Button>
                    )}
                    {isEditingStats && (
                      <div className="absolute -top-8 right-0 flex gap-2">
                         <Button onClick={handleSaveStats} variant="default" size="sm">
                           <Check className="mr-2 h-4 w-4" /> Salvează
                         </Button>
                         <Button onClick={handleCancelEditStats} variant="secondary" size="sm">
                           <X className="mr-2 h-4 w-4" /> Anulează
                         </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 md:gap-y-0 md:gap-x-8">
                       {areStatsLoading ? (
                           [...Array(3)].map((_, index) => (
                             <div key={index} className="text-center flex flex-col items-center">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-12 w-32 mt-3" />
                                <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    <Skeleton className="h-5 w-40" />
                                </div>
                             </div>
                           ))
                       ) : sortedStats.map((stat: any) => {
                          const hasPercentage = stat.label.includes('%');
                          const hasPlus = stat.label.includes('+');
                          const suffix = hasPercentage ? '%' : (hasPlus ? '+' : '');

                          return (
                              <div key={stat.id} className="text-center flex flex-col items-center">
                                <StatIcon name={stat.icon} />
                                {isEditingStats ? (
                                    <div className="flex items-center mt-3">
                                      <Input
                                          type="number"
                                          value={editingStats[stat.id] ?? stat.value}
                                          onChange={(e) => handleStatChange(stat.id, e.target.value)}
                                          className="text-5xl font-bold text-primary text-center p-0 h-auto bg-transparent border-primary w-32"
                                      />
                                      {suffix && <span className="text-5xl font-bold text-primary">{suffix}</span>}
                                    </div>
                                ) : (
                                  <p className="text-5xl font-bold text-primary mt-3">
                                    <AnimatedNumber value={stat.value} suffix={suffix} />
                                  </p>
                                )}
                                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{stat.label.replace(' (%)', '').replace('+', '')}</p>
                              </div>
                          );
                       })}
                    </div>
                  </div>
                </AnimatedSection>
            </div>
        </section>

        {/* About Us Section */}
        <section className="py-24 sm:py-32">
          <AnimatedSection>
            <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <span className="font-semibold text-primary uppercase tracking-wider">Despre Noi</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        {content.about.title}
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-foreground/80">
                        {content.about.text1}
                    </p>
                     <p className="mt-4 text-lg leading-8 text-foreground/80">
                       {content.about.text2}
                    </p>
                    <Button asChild size="lg" variant="outline" className="mt-8">
                      <Link href="/schedule">{content.about.callToActionText}</Link>
                    </Button>
                </div>
                 <div className="order-1 lg:order-2">
                    <div className="rounded-lg shadow-2xl overflow-hidden">
                      <Image 
                          src={content.about.imageUrl} 
                          alt="Echipa Avocat Law în discuții" 
                          width={600}
                          height={400}
                          className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
                          data-ai-hint={content.about.imageHint}
                      />
                    </div>
                </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Practice Areas Section */}
        <section className="bg-secondary py-24 sm:py-32">
          <div className="container">
            <AnimatedSection className="text-center max-w-3xl mx-auto">
              <span className="font-semibold text-primary uppercase tracking-wider">Servicii</span>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                {content.practiceAreas.title}
              </h2>
              <p className="mt-4 text-lg leading-8 text-foreground/80">
                {content.practiceAreas.description}
              </p>
            </AnimatedSection>
            <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {arePracticeAreasLoading ? (
                 [...Array(3)].map((_, i) => (
                    <div key={i} className="text-center p-4"><Skeleton className="h-48 w-full"/></div>
                ))
              ) : Array.isArray(practiceAreasData) && practiceAreasData.length > 0 ? (
                practiceAreasData.map((area: any, index) => (
                    <AnimatedSection key={area.id} style={{ animationDelay: `${index * 150}ms` }}>
                        <div className="group text-center p-8 rounded-lg bg-background shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="flex justify-center mb-5"><AreaIcon name={area.icon} /></div>
                            <h3 className="font-headline text-xl font-semibold text-primary">{area.title}</h3>
                            <p className="mt-2 text-muted-foreground">
                                {area.description}
                            </p>
                        </div>
                    </AnimatedSection>
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground">Nu există servicii adăugate.</p>
              )}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 sm:py-32">
            <div className="container">
                 <AnimatedSection className="text-center max-w-3xl mx-auto">
                    <span className="font-semibold text-primary uppercase tracking-wider">Testimoniale</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        Ce Spun Clienții Noștri
                    </h2>
                </AnimatedSection>
                <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {areTestimonialsLoading ? (
                        [...Array(2)].map((_, i) => (
                            <Card key={i} className="p-8"><Skeleton className="h-full w-full"/></Card>
                        ))
                    ) : Array.isArray(testimonialsData) && testimonialsData.length > 0 ? (
                        testimonialsData.map((testimonial: any, index) => (
                            <AnimatedSection key={testimonial.id} style={{ animationDelay: `${index * 150}ms` }}>
                                <Card className="p-8 h-full flex flex-col">
                                    <CardContent className="p-0 flex-grow">
                                        <MessageCircle className="h-8 w-8 text-accent mb-4" />
                                        <blockquote className="text-lg text-foreground/90 italic">"{testimonial.quote}"</blockquote>
                                    </CardContent>
                                    <CardFooter className="pt-6 pb-0 px-0 mt-4">
                                        <Avatar>
                                            <AvatarImage src={testimonial.avatarUrl} alt={testimonial.author} />
                                            <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4">
                                            <p className="font-semibold">{testimonial.author}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </AnimatedSection>
                        ))
                    ) : (
                         <p className="col-span-full text-center text-muted-foreground">Nu există testimoniale adăugate.</p>
                    )}
                </div>
            </div>
        </section>
        
        {/* Pricing Section */}
        <section className="bg-secondary py-24 sm:py-32">
            <div className="container">
                <AnimatedSection className="text-center max-w-3xl mx-auto">
                    <span className="font-semibold text-primary uppercase tracking-wider">Prețuri</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        {content.pricing.title}
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-foreground/80">
                       {content.pricing.description}
                    </p>
                </AnimatedSection>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                   {arePricesLoading ? (
                        [...Array(2)].map((_, i) => (
                            <Card key={i} className="flex flex-col"><Skeleton className="h-full w-full"/></Card>
                        ))
                   ) : Array.isArray(pricesData) && pricesData.length > 0 ? (
                    pricesData.map((price: any, index) => (
                        <AnimatedSection key={price.id} style={{ animationDelay: `${index * 150}ms` }}>
                            <Card className="flex flex-col text-center rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                <CardHeader className="bg-primary/5 rounded-t-lg">
                                    <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2 text-primary">

                                        {price.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow p-8">
                                    {price.type === 'flat' && price.flatRate &&
                                        <p className="text-6xl font-bold text-primary">{price.flatRate}<span className="text-3xl text-primary/80">€</span></p>
                                    }
                                    {price.type === 'hourly' && price.pricePerHour &&
                                        <p className="text-6xl font-bold text-primary">{price.pricePerHour}<span className="text-xl font-normal text-muted-foreground">€/oră</span></p>
                                    }
                                    <p className="text-muted-foreground mt-6">{price.description}</p>
                                </CardContent>
                                <CardFooter className="p-6 bg-primary/5 rounded-b-lg">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href="/schedule">Programează o Consultație</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </AnimatedSection>
                    ))
                   ) : (
                    <p className="col-span-full text-center text-muted-foreground">Prețurile nu au fost încă configurate.</p>
                   )}
                </div>
            </div>
        </section>

        {/* Blog Section */}
        <section className="py-24 sm:py-32">
            <div className="container">
                <AnimatedSection className="text-center max-w-3xl mx-auto">
                    <span className="font-semibold text-primary uppercase tracking-wider">{content.blog.title}</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        {content.blog.subtitle}
                    </h2>
                </AnimatedSection>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {areBlogPostsLoading ? (
                        [...Array(3)].map((_, i) => (
                            <Card key={i} className="overflow-hidden flex flex-col"><Skeleton className="h-full w-full"/></Card>
                        ))
                    ) : Array.isArray(blogPosts) && blogPosts.length > 0 ? (
                        blogPosts.slice(0, 3).map((post: any, index) => (
                            <AnimatedSection key={post.id} style={{ animationDelay: `${index * 150}ms` }}>
                                <Card className="overflow-hidden flex flex-col group shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg">
                                    <div className="h-56 relative w-full overflow-hidden">
                                        <Image src={post.imageUrl || ""} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={post.imageHint} />
                                    </div>
                                    <CardHeader>
                                        <p className="text-sm text-muted-foreground">{post.date}</p>
                                        <CardTitle className="font-headline text-xl group-hover:text-accent transition-colors">{post.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-muted-foreground">{post.excerpt}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild variant="link" className="p-0 text-primary">
                                        <Link href={`/blog/${post.slug}`}>Citește mai mult</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </AnimatedSection>
                        ))
                    ) : (
                         <p className="col-span-full text-center text-muted-foreground">Nu există articole de blog.</p>
                    )}
                </div>
            </div>
        </section>

        {/* Contact & Map Section */}
        <section className="bg-secondary py-24 sm:py-32">
          <AnimatedSection>
            <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div>
                    <span className="font-semibold text-primary uppercase tracking-wider">Contact</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        {content.contact.title}
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-foreground/80">
                        {content.contact.text}
                    </p>
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-4">
                            <MapPin className="h-6 w-6 text-primary" />
                            <p className="text-lg">{content.contact.address}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Phone className="h-6 w-6 text-primary" />
                            <p className="text-lg">{content.contact.phone}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Mail className="h-6 w-6 text-primary" />
                            <p className="text-lg">{content.contact.email}</p>
                        </div>
                    </div>
                     <Button asChild size="lg" className="mt-8">
                      <Link href="/schedule">Programează Acum</Link>
                    </Button>
                </div>
                <div className="h-96 lg:h-full min-h-[400px] rounded-lg overflow-hidden shadow-xl">
                     <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2848.831032383502!2d26.10253841540963!3d44.43594837910178!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1ff4f1a6c117b%3A0x46b3848873f1c1f2!2sPia%C8%9Ba%20Unirii%2C%20Bucure%C8%99ti!5e0!3m2!1sro!2sro!4v1689255776658!5m2!1sro!2sro" 
                        width="100%" 
                        height="100%" 
                        style={{border:0}} 
                        allowFullScreen={true} 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade">
                    </iframe>
                </div>
            </div>
          </AnimatedSection>
        </section>
      </div>
    </>
  );
}
