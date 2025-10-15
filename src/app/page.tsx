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
import { doc, setDoc, getDoc } from "firebase/firestore";

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
import { useFirebase, useUser } from "@/firebase/provider";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

const heroImage = PlaceHolderImages.find((img) => img.id === "hero-image");

const practiceAreas = [
  {
    icon: <Gavel className="h-10 w-10 text-primary" />,
    title: "Corporate Law",
    description:
      "Expert guidance on mergers, acquisitions, and corporate governance to protect and grow your business.",
  },
  {
    icon: <Landmark className="h-10 w-10 text-primary" />,
    title: "Real Estate Law",
    description:
      "Navigating complex real estate transactions, from commercial leases to property acquisitions.",
  },
  {
    icon: <BookOpen className="h-10 w-10 text-primary" />,
    title: "Intellectual Property",
    description:
      "Protecting your innovations and creative works with robust patent, trademark, and copyright strategies.",
  },
];

export default function Home() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [headline, setHeadline] = useState("Trusted Legal Expertise for Modern Challenges");
  const [body, setBody] = useState("Argos Law provides premier legal services tailored to your unique needs. Our team of experienced attorneys is dedicated to achieving the best possible outcomes for our clients through strategic counsel and relentless advocacy.");
  const [callToAction, setCallToAction] = useState("Schedule a Consultation");
  const [pricePerHour, setPricePerHour] = useState(250);
  const [flatRate, setFlatRate] = useState(1000);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestionTool, setShowSuggestionTool] = useState(false);

  const [tempHeadline, setTempHeadline] = useState(headline);
  const [tempBody, setTempBody] = useState(body);
  const [tempCallToAction, setTempCallToAction] = useState(callToAction);
  const [tempPricePerHour, setTempPricePerHour] = useState(pricePerHour);
  const [tempFlatRate, setTempFlatRate] = useState(flatRate);

  useEffect(() => {
    if (firestore) {
      const contentRef = doc(firestore, "landing_page_content", "main");
      const priceRef = doc(firestore, "consultation_prices", "default");

      const fetchData = async () => {
        setIsDataLoading(true);
        try {
          const [contentSnap, priceSnap] = await Promise.all([
            getDoc(contentRef),
            getDoc(priceRef),
          ]);

          if (contentSnap.exists()) {
            const data = contentSnap.data();
            setHeadline(data.headline || headline);
            setBody(data.bodyText || body);
            setCallToAction(data.callToActionText || callToAction);
            setTempHeadline(data.headline || headline);
            setTempBody(data.bodyText || body);
            setTempCallToAction(data.callToActionText || callToAction);
          }

          if (priceSnap.exists()) {
            const data = priceSnap.data();
            setPricePerHour(data.pricePerHour || pricePerHour);
            setFlatRate(data.flatRate || flatRate);
            setTempPricePerHour(data.pricePerHour || pricePerHour);
            setTempFlatRate(data.flatRate || flatRate);
          }
        } catch (error) {
          console.error("Error fetching page content:", error);
        } finally {
          setIsDataLoading(false);
        }
      };
      fetchData();
    }
  }, [firestore]);


  const handleSaveChanges = () => {
    if (!firestore) return;
    
    const contentRef = doc(firestore, "landing_page_content", "main");
    const priceRef = doc(firestore, "consultation_prices", "default");

    const contentData = {
      headline: tempHeadline,
      bodyText: tempBody,
      callToActionText: tempCallToAction,
      sectionName: "Hero"
    };

    const priceData = {
      pricePerHour: tempPricePerHour,
      flatRate: tempFlatRate,
    };
    
    updateDocumentNonBlocking(contentRef, contentData);
    updateDocumentNonBlocking(priceRef, priceData);

    setHeadline(tempHeadline);
    setBody(tempBody);
    setCallToAction(tempCallToAction);
    setPricePerHour(tempPricePerHour);
    setFlatRate(tempFlatRate);
    setIsEditing(false);
    
    toast({
      title: "Success",
      description: "Landing page content has been updated.",
    });
  };

  const handleCancelChanges = () => {
    setTempHeadline(headline);
    setTempBody(body);
    setTempCallToAction(callToAction);
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

  return (
    <>
      <div className="relative isolate">
        <section className="relative h-[60vh] min-h-[500px] w-full">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

          <div className="relative container h-full flex flex-col justify-end pb-12 text-left">
            <div className="max-w-2xl">
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
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Our Practice Areas
              </h2>
              <p className="mt-4 text-lg leading-8 text-foreground/80">
                Delivering exceptional results across a wide range of legal fields.
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
                Precios de Consulta
              </h2>
              <p className="mt-4 text-lg leading-8 text-foreground/80">
                Planes transparentes y flexibles que se adaptan a sus necesidades.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign />
                    Por Hora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">${pricePerHour}</p>
                  <p className="text-muted-foreground">Ideal para consultas específicas y asesoramiento continuo.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale />
                    Tarifa Plana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">${flatRate}</p>
                  <p className="text-muted-foreground">Perfecto para proyectos definidos y presupuestos predecibles.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {user && isEditing && (
          <div className="fixed bottom-4 right-4 left-4 z-50">
            <Card className="max-w-4xl mx-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <PenSquare className="w-6 h-6"/>
                  Editing Landing Page
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <span className="sr-only">Close</span>
                </Button>
              </div>
             
              <div className="space-y-4">
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={tempHeadline}
                    onChange={(e) => setTempHeadline(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="body">Body Text</Label>
                  <Textarea
                    id="body"
                    value={tempBody}
                    onChange={(e) => setTempBody(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="cta">Call to Action Button</Label>
                  <Input
                    id="cta"
                    value={tempCallToAction}
                    onChange={(e) => setTempCallToAction(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price-per-hour">Precio Por Hora</Label>
                    <Input
                      id="price-per-hour"
                      type="number"
                      value={tempPricePerHour}
                      onChange={(e) => setTempPricePerHour(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="flat-rate">Tarifa Plana</Label>
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
                <Button variant="outline" onClick={handleCancelChanges}>Cancel</Button>
                <Button variant="secondary" onClick={() => setShowSuggestionTool(true)}>
                  <Wand2 className="mr-2 h-4 w-4" /> Suggest with AI
                </Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
              </div>
            </Card>
          </div>
        )}

        { user && (
          <div className="fixed bottom-6 right-6 z-40">
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <Label htmlFor="edit-mode" className="font-medium">
                  Admin Mode
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
