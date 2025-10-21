
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
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { doc } from "firebase/firestore";

import { PlaceHolderImages } from "@/lib/placeholder-images";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ContentSuggestionTool } from "@/components/content-suggestion-tool";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const heroImage = PlaceHolderImages.find((img) => img.id === "hero-image");
const aboutImage = PlaceHolderImages.find((img) => img.id === "about-image");
const blogImage1 = PlaceHolderImages.find((img) => img.id === "blog-1");
const blogImage2 = PlaceHolderImages.find((img) => img.id === "blog-2");
const blogImage3 = PlaceHolderImages.find((img) => img.id === "blog-3");


const practiceAreas = [
  {
    icon: <Gavel className="h-10 w-10 text-primary" />,
    title: "Drept Corporativ",
    description:
      "Consultanță de specialitate privind fuziuni, achiziții și guvernanță corporativă pentru a vă proteja și dezvolta afacerea.",
  },
  {
    icon: <Landmark className="h-10 w-10 text-primary" />,
    title: "Drept Imobiliar",
    description:
      "Navigarea tranzacțiilor imobiliare complexe, de la închirieri comerciale la achiziții de proprietăți.",
  },
  {
    icon: <BookOpen className="h-10 w-10 text-primary" />,
    title: "Proprietate Intelectuală",
    description:
      "Protejarea inovațiilor și creațiilor dvs. cu strategii solide de brevetare, mărci comerciale și drepturi de autor.",
  },
];

const stats = [
    { icon: <Award className="h-8 w-8 text-accent" />, value: "98%", label: "Rata de Succes" },
    { icon: <Users className="h-8 w-8 text-accent" />, value: "1,200+", label: "Clienți Mulțumiți" },
    { icon: <TrendingUp className="h-8 w-8 text-accent" />, value: "20+", label: "Ani de Experiență" },
];

const testimonials = [
  {
    quote: "Profesionalismul și dedicarea echipei Avocat Law au depășit cu mult așteptările noastre. Soluțiile lor strategice au fost esențiale pentru succesul nostru.",
    author: "Alexandru Popescu",
    title: "CEO, Tech Solutions",
    avatar: "https://i.pravatar.cc/150?img=12"
  },
  {
    quote: "Am fost impresionat de atenția la detalii și de comunicarea transparentă pe parcursul întregului proces. Recomand cu încredere serviciile lor.",
    author: "Elena Ionescu",
    title: "Manager, Innovate Real Estate",
    avatar: "https://i.pravatar.cc/150?img=5"
  },
];

const blogPosts = [
    {
        id: 1,
        title: "Navigarea Modificărilor Legislative din 2024",
        date: "25 Iulie 2024",
        excerpt: "O analiză detaliată a noilor reglementări fiscale și cum acestea vă pot afecta afacerea...",
        image: blogImage1?.imageUrl,
        imageHint: blogImage1?.imageHint,
    },
    {
        id: 2,
        title: "Protecția Proprietății Intelectuale în Era Digitală",
        date: "18 Iulie 2024",
        excerpt: "Strategii esențiale pentru a vă proteja activele digitale și mărcile comerciale online...",
        image: blogImage2?.imageUrl,
        imageHint: blogImage2?.imageHint,
    },
    {
        id: 3,
        title: "Ghidul Complet al Tranzacțiilor Imobiliare",
        date: "10 Iulie 2024",
        excerpt: "Pașii cheie și capcanele de evitat atunci când cumpărați sau vindeți proprietăți comerciale...",
        image: blogImage3?.imageUrl,
        imageHint: blogImage3?.imageHint,
    }
];

export default function Home() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);
  const { data: adminRole, isLoading: isLoadingRole } = useDoc(adminRoleRef);
  const isUserAdmin = adminRole?.isAdmin === true;

  const contentRef = useMemoFirebase(() => firestore ? doc(firestore, "landing_page_content", "main") : null, [firestore]);

  const { data: contentData, isLoading: isContentLoading } = useDoc(contentRef);
  
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState(heroImage?.imageUrl || "");

  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestionTool, setShowSuggestionTool] = useState(false);

  const [tempHeadline, setTempHeadline] = useState("");
  const [tempBody, setTempBody] = useState("");
  const [tempCallToAction, setTempCallToAction] = useState("");
  const [tempHeroImageUrl, setTempHeroImageUrl] = useState("");
  
  useEffect(() => {
    if (contentData) {
      const { headline, bodyText, callToActionText, imageUrl } = contentData;
      const initialHeadline = headline || "Partenerul Dumneavoastră Strategic în Navigarea Complexității Juridice";
      const initialBody = bodyText || "La Avocat Law, combinăm expertiza aprofundată cu o abordare personalizată pentru a oferi soluții juridice inovatoare și eficiente, asigurând succesul și protecția intereselor dumneavoastră.";
      const initialCta = callToActionText || "Programează o Consultație";
      const initialImageUrl = imageUrl || heroImage?.imageUrl || "";

      setHeadline(initialHeadline);
      setBody(initialBody);
      setCallToAction(initialCta);
      setHeroImageUrl(initialImageUrl);
      
      setTempHeadline(initialHeadline);
      setTempBody(initialBody);
      setTempCallToAction(initialCta);
      setTempHeroImageUrl(initialImageUrl);
    } else if (!isContentLoading && !contentData) {
        const defaultHeadline = "Partenerul Dumneavoastră Strategic în Navigarea Complexității Juridice";
        const defaultBody = "La Avocat Law, combinăm expertiza aprofundată cu o abordare personalizată pentru a oferi soluții juridice inovatoare și eficiente, asigurând succesul și protecția intereselor dumneavoastră.";
        const defaultCta = "Programează o Consultație";
        const defaultImg = heroImage?.imageUrl || "";
        
        setHeadline(defaultHeadline);
        setBody(defaultBody);
        setCallToAction(defaultCta);
        setHeroImageUrl(defaultImg);

        setTempHeadline(defaultHeadline);
        setTempBody(defaultBody);
        setTempCallToAction(defaultCta);
        setTempHeroImageUrl(defaultImg);
    }
  }, [contentData, isContentLoading]);


  const handleSaveChanges = () => {
    if (!firestore || !contentRef) return;
    
    const newContentData = {
      headline: tempHeadline,
      bodyText: tempBody,
      callToActionText: tempCallToAction,
      imageUrl: tempHeroImageUrl,
      sectionName: "Hero"
    };
    
    setDocumentNonBlocking(contentRef, newContentData, { merge: true });

    setHeadline(tempHeadline);
    setBody(tempBody);
    setCallToAction(tempCallToAction);
    setHeroImageUrl(tempHeroImageUrl);
    setIsEditing(false);
    
    toast({
      title: "Succes",
      description: "Conținutul paginii de start a fost actualizat.",
    });
  };

  const handleCancelChanges = () => {
    setTempHeadline(headline);
    setTempBody(body);
    setTempCallToAction(callToAction);
    setTempHeroImageUrl(heroImageUrl);
    setIsEditing(false);
  };
  
  const handleApplySuggestion = (suggestion: {
    suggestedHeadline?: string;
    suggestedBodyText?: string;
    suggestedCallToAction?: string;
  }) => {
    if (suggestion.suggestedHeadline) setTempHeadline(suggestion.suggestedHeadline);
    if (suggestion.suggestedBodyText) setTempBody(suggestion.suggestedBodyText);
    if (suggestion.suggestedCallToAction) setTempCallToAction(suggestion.suggestedCallToAction);
  };
  
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
              src={heroImageUrl || (heroImage?.imageUrl || "")}
              alt={headline || "Avocat Law hero image"}
              fill
              className="object-cover"
              priority
              data-ai-hint="law office"
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
                    {headline}
                  </h1>
                  <p className="mt-6 max-w-3xl text-lg leading-8 text-primary-foreground/90">
                    {body}
                  </p>
                  <div className="mt-10">
                    <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link href="/schedule">{callToAction}</Link>
                    </Button>
                  </div>
                </>
              )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-t bg-secondary">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    {stats.map((stat) => (
                        <div key={stat.label} className="py-8 px-4 text-center">
                           <div className="flex justify-center items-center gap-4">
                             {stat.icon}
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
                        Angajament, Integritate și Rezultate Excepționale
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-foreground/80">
                        Fondată pe principiile integrității și excelenței, Avocat Law este mai mult decât un birou de avocatură - suntem partenerii strategici ai clienților noștri. Misiunea noastră este să oferim consiliere juridică clară, pragmatică și adaptată obiectivelor specifice ale fiecărui client.
                    </p>
                     <p className="mt-4 text-lg leading-8 text-foreground/80">
                       Cu o echipă de avocați specializați în diverse domenii, de la drept corporativ la litigii complexe, abordăm fiecare caz cu dedicare și o înțelegere profundă a contextului de afaceri.
                    </p>
                    <Button asChild size="lg" variant="outline" className="mt-8">
                      <Link href="/schedule">Află mai mult</Link>
                    </Button>
                </div>
                 <div className="order-1 lg:order-2 h-96 lg:h-[32rem] relative rounded-lg overflow-hidden shadow-xl">
                    <Image 
                        src={aboutImage?.imageUrl || ""} 
                        alt="Echipa Avocat Law în discuții" 
                        fill 
                        className="object-cover"
                        data-ai-hint="lawyers meeting"
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
                Domeniile noastre de Practică
              </h2>
              <p className="mt-4 text-lg leading-8 text-foreground/80">
                Oferim rezultate excepționale într-o gamă largă de domenii juridice, asigurând o acoperire completă pentru nevoile clienților noștri.
              </p>
            </div>
            <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3">
              {practiceAreas.map((area) => (
                <div key={area.title} className="text-center">
                  <div className="flex justify-center mb-4">{area.icon}</div>
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
                        Ce Spun Clienții Noștri
                    </h2>
                </div>
                <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {testimonials.map((testimonial) => (
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
        
        {/* Blog Section */}
        <section className="bg-secondary py-24 sm:py-32">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto">
                    <span className="font-semibold text-primary uppercase tracking-wider">Noutăți & Analize</span>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl mt-2">
                        Articole Recente
                    </h2>
                </div>
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map((post) => (
                        <Card key={post.id} className="overflow-hidden flex flex-col">
                           <div className="h-56 relative w-full">
                             <Image src={post.image || ""} alt={post.title} fill className="object-cover" data-ai-hint={post.imageHint} />
                           </div>
                            <CardHeader>
                                <p className="text-sm text-muted-foreground">{post.date}</p>
                                <CardTitle className="font-headline text-xl">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{post.excerpt}</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="link" className="p-0">Citește mai mult</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>


        {/* Contact & Map Section */}
        <section className="py-24 sm:py-32">
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


        {isUserAdmin && isEditing && (
          <div className="fixed bottom-4 right-4 left-4 z-50">
            <Card className="max-w-4xl mx-auto p-6 shadow-2xl bg-background/95 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <PenSquare className="w-6 h-6"/>
                  Editare Secțiune Principală
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <span className="sr-only">Închide</span>
                </Button>
              </div>
             
              <div className="space-y-4">
                <div>
                  <Label htmlFor="headline">Titlu Principal</Label>
                  <Input
                    id="headline"
                    value={tempHeadline}
                    onChange={(e) => setTempHeadline(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="body">Text Principal</Label>
                  <Textarea
                    id="body"
                    value={tempBody}
                    onChange={(e) => setTempBody(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="cta">Text Buton Acțiune</Label>
                  <Input
                    id="cta"
                    value={tempCallToAction}
                    onChange={(e) => setTempCallToAction(e.target.value)}
                  />
                </div>
                 <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="hero-image-url">URL Imagine Principală</Label>
                    <a
                      href="https://postimages.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      (încarcă pe postimages.org)
                    </a>
                  </div>
                  <Input
                    id="hero-image-url"
                    value={tempHeroImageUrl}
                    onChange={(e) => setTempHeroImageUrl(e.target.value)}
                    placeholder="https://i.postimg.cc/..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleCancelChanges}>Anulează</Button>
                <Button variant="secondary" onClick={() => setShowSuggestionTool(true)}>
                  <Wand2 className="mr-2 h-4 w-4" /> Sugerează cu AI
                </Button>
                <Button onClick={handleSaveChanges}>Salvează Modificările</Button>
              </div>
            </Card>
          </div>
        )}

        { !isUserLoading && isUserAdmin && (
          <div className="fixed bottom-6 right-6 z-40">
            <Card className="p-3 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <Label htmlFor="edit-mode" className="font-medium">
                  Mod Admin
                </Label>
                <Switch
                  id="edit-mode"
                  checked={isEditing}
                  onCheckedChange={setIsEditing}
                />
              </div>
            </Card>
          </div>
        )}
      </div>
      <ContentSuggestionTool
        open={showSuggestionTool}
        onOpenChange={setShowSuggestionTool}
        currentContent={{
          currentHeadline: tempHeadline,
          currentBody: tempBody,
          currentCallToAction: tempCallToAction,
        }}
        onApplySuggestion={handleApplySuggestion}
      />
    </>
  );
}
