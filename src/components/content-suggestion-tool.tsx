"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wand2 } from "lucide-react";
import { z } from "zod";

import {
  generateLandingPageContent,
  type GenerateLandingPageContentOutput,
} from "@/ai/flows/generate-landing-page-content";
import { ContentSuggestionSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

type SuggestionToolProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentContent: {
    currentHeadline: string;
    currentBody: string;
    currentCallToAction: string;
  };
  onApplySuggestion: (suggestion: Partial<GenerateLandingPageContentOutput>) => void;
};

type FormData = z.infer<typeof ContentSuggestionSchema>;

export function ContentSuggestionTool({
  open,
  onOpenChange,
  currentContent,
  onApplySuggestion,
}: SuggestionToolProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] =
    useState<GenerateLandingPageContentOutput | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(ContentSuggestionSchema),
    defaultValues: {
      legalTrends: "",
      clientFeedback: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await generateLandingPageContent({
        ...data,
        ...currentContent,
      });
      setSuggestions(result);
    } catch (error) {
      console.error("Nu s-a putut genera conținut:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setSuggestions(null);
  }

  const handleApply = (suggestion: Partial<GenerateLandingPageContentOutput>) => {
    onApplySuggestion(suggestion);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-primary">
            <Wand2 /> Sugestii de Conținut AI
          </DialogTitle>
          <DialogDescription>
            Oferiți un context, iar AI-ul nostru va sugera conținut nou pentru
            pagina dvs. de start.
          </DialogDescription>
        </DialogHeader>

        {!suggestions && !isLoading && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="legalTrends"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tendințe Juridice Actuale</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="ex: 'Accent sporit pe legile privind confidențialitatea datelor', 'Creșterea acordurilor de muncă la distanță'"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="clientFeedback"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Feedback Recent de la Clienți</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="ex: 'Clienții cer prețuri mai transparente', 'Dificultăți în înțelegerea termenilor juridici complecși'"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                    <Button type="submit">Generează Sugestii</Button>
                </DialogFooter>
            </form>
            </Form>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Se generează idei...</p>
          </div>
        )}

        {suggestions && (
          <div className="space-y-4 pt-4">
            <SuggestionCard title="Titlu Sugerat" content={suggestions.suggestedHeadline} onApply={() => handleApply({ suggestedHeadline: suggestions.suggestedHeadline })} />
            <SuggestionCard title="Text Principal Sugerat" content={suggestions.suggestedBodyText} onApply={() => handleApply({ suggestedBodyText: suggestions.suggestedBodyText })} />
            <SuggestionCard title="Buton de Acțiune Sugerat" content={suggestions.suggestedCallToAction} onApply={() => handleApply({ suggestedCallToAction: suggestions.suggestedCallToAction })}/>
            <DialogFooter className="pt-4">
                <Button variant="secondary" onClick={() => setSuggestions(null)}>Încearcă Din Nou</Button>
                <Button onClick={handleClose}>Închide</Button>
            </DialogFooter>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

function SuggestionCard({ title, content, onApply }: { title: string, content: string, onApply: () => void }) {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Button size="sm" variant="outline" onClick={onApply}>Aplică</Button>
            </CardHeader>
            <CardContent>
                <p className="text-base text-foreground">{content}</p>
            </CardContent>
        </Card>
    );
}
