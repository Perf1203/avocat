
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BookOpen,
  Gavel,
  Landmark,
  PenSquare,
  Sparkles,
  Wand2,
  DollarSign,
  Scale
} from "lucide-react";
import Link from "next/link";
import { doc } from "firebase/firestore";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

const defaultHeroImage = PlaceHolderImages.find((img) => img.id === "hero-image");

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
  const priceRef = useMemoFirebase(() => firestore ? doc(firestore, "consultation_prices", "default") : null, [firestore]);

  const { data: contentData, isLoading: isContentLoading } = useDoc(contentRef);
  const { data: priceData, isLoading: isPriceLoading } = useDoc(priceRef);

  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState(defaultHeroImage?.imageUrl || "");
  const [pricePerHour, setPricePerHour] = useState(0);
  const [flatRate, setFlatRate] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestionTool, setShowSuggestionTool] = useState(false);

  const [tempHeadline, setTempHeadline] = useState("");
  const [tempBody, setTempBody] = useState("");
  const [tempCallToAction, setTempCallToAction]
 = useState("");
  const [tempHeroImageUrl, setTempHeroImageUrl] = useState("");
  const [tempPricePerHour, setTempPricePerHour] = useState(0);
  const [tempFlatRate, setTempFlatRate] = useState(0);
  
  useEffect(() => {
    if (contentData) {
      const { headline, bodyText, callToActionText, imageUrl } = contentData;
      const initialHeadline = headline || "Expertiză Juridică de Încredere pentru Provocări Moderne";
      const initialBody = bodyText || "Avocat Law oferă servicii juridice de prim rang, adaptate nevoilor dumneavoastră unice. Echipa noastră de avocați cu experiență este dedicată obținerii celor mai bune rezultate posibile pentru clienții noștri prin consiliere strategică și pledoarie neobosită.";
      const initialCta = callToActionText || "Programează o Consultație";
      const initialImageUrl = imageUrl || defaultHeroImage?.imageUrl || "";

      setHeadline(initialHeadline);
      setBody(initialBody);
      setCallToAction(initialCta);
      setHeroImageUrl(initialImageUrl);
      
      setTempHeadline(initialHeadline);
      setTempBody(initialBody);
      setTempCallToAction(initialCta);
      setTempHeroImageUrl(initialImageUrl);
    } else if (!isContentLoading && !contentData) {
        // Fallback to defaults if data is loaded but empty
        const defaultHeadline = "Expertiză Juridică de Încredere pentru Provocări Moderne";
        const defaultBody = "Avocat Law oferă servicii juridice de prim rang, adaptate nevoilor dumneavoastră unice. Echipa noastră de avocați cu experiență este dedicată obținerii celor mai bune rezultate posibile pentru clienții noștri prin consiliere strategică și pledoarie neobosită.";
        const defaultCta = "Programează o Consultație";
        const defaultImg = defaultHeroImage?.imageUrl || "";
        
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

  useEffect(() => {
    if (priceData) {
      const { pricePerHour, flatRate } = priceData;
      setPricePerHour(pricePerHour || 250);
      setFlatRate(flatRate || 1000);
      setTempPricePerHour(pricePerHour || 250);
      setTempFlatRate(flatRate || 1000);
    }
  }, [priceData]);


  const handleSaveChanges = () => {
    if (!firestore || !contentRef || !priceRef) return;
    
    const newContentData = {
      headline: tempHeadline,
      bodyText: tempBody,
      callToActionText: tempCallToAction,
      imageUrl: tempHeroImageUrl,
      sectionName: "Hero"
    };

    const newPriceData = {
      pricePerHour: tempPricePerHour,
      flatRate: tempFlatRate,
    };
    
    setDocumentNonBlocking(contentRef, newContentData, { merge: true });
    setDocumentNonBlocking(priceRef, newPriceData, { merge: true });

    setHeadline(tempHeadline);
    setBody(tempBody);
    setCallToAction(tempCallToAction);
    setHeroImageUrl(tempHeroImageUrl);
    setPricePerHour(tempPricePerHour);
    setFlatRate(tempFlatRate);
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
    setTempPricePerHour(pricePerHour);
    setTempFlatRate(flatRate);
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
  
  const isLoading = isContentLoading || isPriceLoading || isLoadingRole;

  return (
    <>
      <div className="relative isolate">
        <section className="relative h-[60vh] min-h-[500px] w-full">
          {isLoading ? (
            <Skeleton className="absolute inset-0" />
          ) : (
            <Image
              src={heroImageUrl || (defaultHeroImage?.imageUrl || "")}
              alt={headline || "Avocat Law hero image"}
              fill
              className="object-cover"
              priority
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
                    {headline}
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-foreground/80">
                    {body}
                  </p>
                  <div className="mt-10">
                    <Button asChild size="lg">
                      <Link href="/schedule">{callToAction}</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Domeniile noastre de practică
              </h2>
              <p className="mt-4 text-lg leading-8 text-foreground/80">
                Oferim rezultate excepționale într-o gamă largă de domenii juridice.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {practiceAreas.map((area) => (
                <Card key={area.title}>
                  <CardHeader className="items-center">
                    {area.icon}
                    <CardTitle className="font-headline text-center pt-4">{area.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">
                      {area.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-24 sm:py-32">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Prețuri Consultanță
              </h2>
              <p className="mt-4 text-lg leading-8 text-foreground/80">
                Planuri transparente și flexibile pentru a se potrivi nevoilor dumneavoastră.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign />
                    Orar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                     <Skeleton className="h-10 w-24" />
                  ) : (
                    <p className="text-4xl font-bold">${pricePerHour}</p>
                  )}
                  <p className="text-muted-foreground">Ideal pentru întrebări specifice și consiliere continuă.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale />
                    Forfetar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   {isLoading ? (
                     <Skeleton className="h-10 w-24" />
                  ) : (
                    <p className="text-4xl font-bold">${flatRate}</p>
                  )}
                  <p className="text-muted-foreground">Perfect pentru proiecte definite și bugete previzibile.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {isUserAdmin && isEditing && (
          <div className="fixed bottom-4 right-4 left-4 z-50">
            <Card className="max-w-4xl mx-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <PenSquare className="w-6 h-6"/>
                  Editare Pagină Principală
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <span className="sr-only">Închide</span>
                </Button>
              </div>
             
              <div className="space-y-4">
                <div>
                  <Label htmlFor="headline">Titlu</Label>
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
                  <Label htmlFor="cta">Buton de Acțiune</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price-per-hour">Preț pe Oră</Label>
                    <Input
                      id="price-per-hour"
                      type="number"
                      value={tempPricePerHour}
                      onChange={(e) => setTempPricePerHour(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="flat-rate">Tarif Fix</Label>
                    <Input
                      id="flat-rate"
                      type="number"
                      value={tempFlatRate}
                      onChange={(e) => setTempFlatRate(Number(e.target.value))}
                    />
                  </div>
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
            <Card className="p-3">
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

    
