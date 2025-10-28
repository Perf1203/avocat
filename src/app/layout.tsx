
import { initializeFirebase } from '@/firebase';
import { getDoc, doc } from 'firebase/firestore';
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ChatWidget } from "@/components/chat-widget";

const { firestore } = initializeFirebase();

export async function generateMetadata(): Promise<Metadata> {
  let seoTitle = "Avocat Law";
  let seoDescription = "Partenerul dumneavoastră juridic de încredere pentru provocări complexe.";
  
  try {
    const settingsRef = doc(firestore, 'admin_settings', 'schedule');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const settings = settingsSnap.data();
      seoTitle = settings.seoTitle || settings.websiteName || seoTitle;
      seoDescription = settings.seoDescription || seoDescription;
    }
  } catch (error) {
    console.error("Failed to fetch SEO settings for metadata:", error);
  }

  return {
    title: seoTitle,
    description: seoDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatWidget />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
