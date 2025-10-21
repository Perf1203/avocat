"use client";

import { useState, useEffect } from "react";
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
  FileText
} from "lucide-react";
import Link from "next/link";
import { collection, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Default Content
const defaultContent = {
    hero: {
        headline: "Partenerul Dumneavoastră Strategic în Navigarea Complexității Juridice",
        bodyText: "La Avocat Law, combinăm expertiza aprofundată cu o abordare personalizată pentru a oferi soluții juridice inovatoare și eficiente, asigurând succesul și protecția intereselor dumneavoastră.",
        callToActionText: "Programează o Consultație",
        imageUrl: "https://i.postimg.cc/13Yp8kG1/bermix-studio-a-VCH-3-B-7-E-unsplash.jpg",
        imageHint: "law office"
    },
    stats: [
        { icon: "Award", value: "98%", label: "Rata de Succes" },
        { icon: "Users", value: "1,200+", label: "Clienți Mulțumiți" },
        { icon: "TrendingUp", value: "20+", label: "Ani de Experiență" },
    ],
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
        areas: [
            { icon: "Gavel", title: "Drept Corporativ", description: "Consultanță de specialitate privind fuziuni, achiziții și guvernanță corporativă pentru a vă proteja și dezvolta afacerea." },
            { icon: "Landmark", title: "Drept Imobiliar", description: "Navigarea tranzacțiilor imobiliare complexe, de la închirieri comerciale la achiziții de proprietăți." },
            { icon: "BookOpen", title: "Proprietate Intelectuală", description: "Protejarea inovațiilor și creațiilor dvs. cu strategii solide de brevetare, mărci comerciale și drepturi de autor." },
        ]
    },
    testimonials: {
        title: "Ce Spun Clienții Noștri",
        items: [
            { quote: "Profesionalismul și dedicarea echipei Avocat Law au depășit cu mult așteptările noastre. Soluțiile lor strategice au fost esențiale pentru succesul nostru.", author: "Alexandru Popescu", title: "CEO, Tech Solutions", avatar: "https://i.pravatar.cc/150?img=12" },
            { quote: "Am fost impresionat de atenția la detalii și de comunicarea transparentă pe parcursul întregului proces. Recomand cu încredere serviciile lor.", author: "Elena Ionescu", title: "Manager, Innovate Real Estate", avatar: "https://i.pravatar.cc/150?img=5" },
        ]
    },
    pricing: {
        title: "Consultanță Transparentă",
        description: "Oferim structuri de preț clare și competitive, adaptate nevoilor dumneavoastră.",
    },
    blog: {
        title: "Noutăți & Analize",
        subtitle: "Articole Recente",
        posts: [
            { id: 1, slug: "navigarea-modificarilor-legislative-din-2024", title: "Navigarea Modificărilor Legislative din 2024", date: "25 Iulie 2024", excerpt: "O analiză detaliată a noilor reglementări fiscale și cum acestea vă pot afecta afacerea...", imageUrl: "https://i.postimg.cc/tJ08L4fQ/scott-graham-OQMZw-Nd3-Th-U-unsplash.jpg", imageHint: "law books" },
            { id: 2, slug: "protectia-proprietatii-intelectuale-in-era-digitala", title: "Protecția Proprietății Intelectuale în Era Digitală", date: "18 Iulie 2024", excerpt: "Strategii esențiale pentru a vă proteja activele digitale și mărcile comerciale online...", imageUrl: "https://i.postimg.cc/Jz3xLpF8/tingey-injury-law-firm-y-Cd-S-L3-T-0-I-unsplash.jpg", imageHint: "digital security" },
            { id: 3, slug: "ghidul-complet-al-tranzactiilor-imobiliare", title: "Ghidul Complet al Tranzacțiilor Imobiliare", date: "10 Iulie 2024", excerpt: "Pașii cheie și capcanele de evitat atunci când cumpărați sau vindeți proprietăți comerciale...", imageUrl: "https://i.postimg.cc/d0pW12M4/maria-ziegler-j-K9-I8-Kq-DC-A-unsplash.jpg", imageHint: "real estate" }
        ]
    }
};

const iconMap: { [key: string]: React.ElementType } = {
  Gavel, Landmark, BookOpen, PenSquare, Sparkles, Wand2, Phone, Mail, MapPin, TrendingUp, Users, Award, MessageCircle, Euro, FileText
};

export default function Home() {
  const { firestore } = useFirebase();
  const { user } = useUser();

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

  const [content, setContent] = useState(defaultContent);
  const [prices, setPrices] = useState<any[]>([]);

  useEffect(() => {
    if (contentData) {
      const newContent = { ...defaultContent };
      (contentData as any[]).forEach(doc => {
        if (newContent.hasOwnProperty(doc.id)) {
           // @ts-ignore
           newContent[doc.id] = { ...newContent[doc.id], ...doc };
        }
      });
      setContent(newContent);
    }
  }, [contentData]);

  useEffect(() => {
    if (pricesData) {
        setPrices(pricesData as any[]);
    }
  }, [pricesData]);
  
  const StatIcon = ({ name }: { name: string }) => {
    const Icon = iconMap[name];
    return Icon ? <Icon className="h-8 w-8 text-accent" /> : null;
  }
  
  const AreaIcon = ({ name }: { name: string }) => {
    const Icon = iconMap[name];
    return Icon ? <Icon className="h-10 w-10 text-primary" /> : null;
  }

  const isLoading = isContentLoading || isLoadingRole;

  return (
    <>
      <div className="relative isolate bg-background">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] w-full text-white">
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
          <div className="absolute inset-0 bg-primary/70" />
          
          <div className="relative container h-full flex flex-col items-center justify-center text-center">
            {isLoading ? (
                <div className="space-y-4 max-w-3xl">
                  <Skeleton className="h-16 w-3/4 mx-auto" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6 mx-auto" />
                  <Skeleton className="h-12 w-48 mt-4 mx-auto" />
                </div>
              ) : (
                <>
                  <h1 className="font-headline text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
                    {content.hero.headline}
                  </h1>
                  <p className="mt-6 max-w-3xl text-lg leading-8 text-primary-foreground/90">
                    {content.hero.bodyText}
                  </p>
                  <div className="mt-10">
                    <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link href="/schedule">{content.hero.callToActionText}</Link>
                    </Button>
                  </div>
                </>
              )}
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
        <section className="border-b border-t bg-secondary">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    {content.stats.map((stat) => (
                        <div key={stat.label} className="py-8 px-4 text-center">
                           <div className="flex justify-center items-center gap-4">
                             <StatIcon name={stat.icon} />
                             <p className="text-4xl font-bold text-primary">{stat.value}</p>
                           </div>
                           <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* About Us Section */}
        <section className="py-24 sm:py-32">
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
                    <Image 
                        src={content.about.imageUrl} 
                        alt="Echipa Avocat Law în discuții" 
                        width={600}
                        height={400}
                        className="rounded-lg shadow-xl w-full h-auto object-cover"
                        data-ai-hint={content.about.imageHint}
                    />
                </div>
            </div>
        </section>

        {/* Practice Areas Section */}
        <section className="bg-secondary py-24 sm:py-32">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto">
              <span className="font-semibold text-primary uppercase tracking-wider">Servicii</span>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                {content.practiceAreas.title}
              </h2>
              <p className="mt-4 text-lg leading-8 text-foreground/80">
                {content.practiceAreas.description}
              </p>
            </div>
            <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3">
              {content.practiceAreas.areas.map((area) => (
                <div key={area.title} className="text-center">
                  <div className="flex justify-center mb-4"><AreaIcon name={area.icon}/></div>
                  <h3 className="font-headline text-xl font-semibold">{area.title}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {area.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 sm:py-32">
            <div className="container">
                 <div className="text-center max-w-3xl mx-auto">
                    <span className="font-semibold text-primary uppercase tracking-wider">Testimoniale</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        {content.testimonials.title}
                    </h2>
                </div>
                <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {content.testimonials.items.map((testimonial) => (
                        <Card key={testimonial.author} className="p-8">
                            <CardContent className="p-0">
                                <MessageCircle className="h-8 w-8 text-accent mb-4" />
                                <blockquote className="text-lg text-foreground/90 italic">"{testimonial.quote}"</blockquote>
                            </CardContent>
                            <CardFooter className="pt-6 pb-0 px-0">
                                 <Avatar>
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                                    <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                    <p className="font-semibold">{testimonial.author}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Pricing Section */}
        <section className="bg-secondary py-24 sm:py-32">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto">
                    <span className="font-semibold text-primary uppercase tracking-wider">Prețuri</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        {content.pricing.title}
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-foreground/80">
                       {content.pricing.description}
                    </p>
                </div>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                   {arePricesLoading ? (
                        [...Array(2)].map((_, i) => (
                            <Card key={i} className="flex flex-col"><Skeleton className="h-full w-full"/></Card>
                        ))
                   ) : prices.length > 0 ? (
                    prices.map((price) => (
                        <Card key={price.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                    {price.flatRate ? <Euro/> : <FileText />}
                                    {price.description}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                {price.flatRate && <p className="text-4xl font-bold mb-2">{price.flatRate} €</p>}
                                {price.pricePerHour && <p className="text-4xl font-bold mb-2">{price.pricePerHour} €<span className="text-lg font-normal text-muted-foreground">/oră</span></p>}
                                <p className="text-muted-foreground">{price.flatRate ? "Taxă unică pentru o consultație completă." : "Perfect pentru consultanță continuă."}</p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href="/schedule">Programează o Consultație</Link>
                                </Button>
                            </CardFooter>
                        </Card>
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
                <div className="text-center max-w-3xl mx-auto">
                    <span className="font-semibold text-primary uppercase tracking-wider">{content.blog.title}</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        {content.blog.subtitle}
                    </h2>
                </div>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {content.blog.posts.map((post) => (
                        <Card key={post.id} className="overflow-hidden flex flex-col">
                           <div className="h-56 relative w-full">
                             <Image src={post.imageUrl || ""} alt={post.title} fill className="object-cover" data-ai-hint={post.imageHint} />
                           </div>
                            <CardHeader>
                                <p className="text-sm text-muted-foreground">{post.date}</p>
                                <CardTitle className="font-headline text-xl">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{post.excerpt}</p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="link" className="p-0">
                                  <Link href={`/blog/${post.slug}`}>Citește mai mult</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Contact & Map Section */}
        <section className="bg-secondary py-24 sm:py-32">
            <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                 <div>
                    <span className="font-semibold text-primary uppercase tracking-wider">Contact</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        Suntem Aici pentru a Vă Ajuta
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-foreground/80">
                        Fie că aveți o întrebare, doriți să stabiliți o consultație sau aveți nevoie de asistență juridică imediată, echipa noastră este pregătită să vă răspundă.
                    </p>
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-4">
                            <MapPin className="h-6 w-6 text-primary" />
                            <p className="text-lg">Bulevardul Unirii, Nr. 1, București, România</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Phone className="h-6 w-6 text-primary" />
                            <p className="text-lg">+40 21 123 4567</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Mail className="h-6 w-6 text-primary" />
                            <p className="text-lg">contact@avocatlaw.ro</p>
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
        </section>
      </div>
    </>
  );
}
