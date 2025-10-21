
'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Sample data - in a real app, this would come from a database
const blogPosts: { [key: string]: any } = {
    'navigarea-modificarilor-legislative-din-2024': {
        title: "Navigarea Modificărilor Legislative din 2024",
        date: "25 Iulie 2024",
        content: [
            "O analiză detaliată a noilor reglementări fiscale și cum acestea vă pot afecta afacerea...",
            "Aici ar veni conținutul complet al articolului de blog. Acesta este un text demonstrativ pentru a arăta structura paginii. Puteți extinde acest conținut cu paragrafe multiple, liste și alte elemente de formatare.",
            "De exemplu, am putea discuta despre impactul asupra TVA, impozitului pe profit și alte taxe relevante pentru mediul de afaceri din România. Este esențial ca fiecare companie să înțeleagă aceste schimbări pentru a rămâne conformă și pentru a optimiza structura fiscală."
        ],
        image: "https://i.postimg.cc/tJ08L4fQ/scott-graham-OQMZw-Nd3-Th-U-unsplash.jpg",
    },
    'protectia-proprietatii-intelectuale-in-era-digitala': {
        title: "Protecția Proprietății Intelectuale în Era Digitală",
        date: "18 Iulie 2024",
        content: [
            "Strategii esențiale pentru a vă proteja activele digitale și mărcile comerciale online...",
            "În lumea digitală de astăzi, protejarea proprietății intelectuale este mai importantă ca niciodată. Acest articol explorează pașii pe care îi puteți lua pentru a vă asigura că marca, conținutul și inovațiile dvs. sunt protejate legal împotriva utilizării neautorizate."
        ],
        image: "https://i.postimg.cc/Jz3xLpF8/tingey-injury-law-firm-y-Cd-S-L3-T-0-I-unsplash.jpg",
    },
    'ghidul-complet-al-tranzactiilor-imobiliare': {
        title: "Ghidul Complet al Tranzacțiilor Imobiliare",
        date: "10 Iulie 2024",
        content: [
            "Pașii cheie și capcanele de evitat atunci când cumpărați sau vindeți proprietăți comerciale...",
            "Tranzacțiile imobiliare pot fi complexe și pline de riscuri. Acest ghid vă oferă o perspectivă clară asupra procesului, de la due diligence la negocierea contractului și închiderea tranzacției, pentru a vă ajuta să navigați cu încredere pe piața imobiliară."
        ],
        image: "https://i.postimg.cc/d0pW12M4/maria-ziegler-j-K9-I8-Kq-DC-A-unsplash.jpg",
    }
};


export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const post = blogPosts[slug];

    if (!post) {
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
        <div className="container py-24 sm:py-32 max-w-4xl">
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
                    {post.content.map((paragraph: string, index: number) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </article>
        </div>
    );
}

    