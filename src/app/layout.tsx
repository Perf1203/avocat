
'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ChatWidget } from "@/components/chat-widget";
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from "firebase/firestore";

// export const metadata: Metadata = {
//   title: "Avocat Law",
//   description: "Partenerul dumneavoastră juridic de încredere pentru provocări complexe.",
// };

function AppLayout({ children }: { children: React.ReactNode }) {
  const { firestore } = useFirebase();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'admin_settings', 'schedule');
  }, [firestore]);
  
  const { data: settings } = useDoc(settingsRef);
  const websiteName = settings?.websiteName || "Avocat Law";

  useEffect(() => {
    document.title = websiteName;
  }, [websiteName]);

  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <ChatWidget />
        <Toaster />
      </body>
    </>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <FirebaseClientProvider>
        <AppLayout>{children}</AppLayout>
      </FirebaseClientProvider>
    </html>
  );
}
