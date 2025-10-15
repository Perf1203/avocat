"use client";

import { Menu, Scale } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { doc } from 'firebase/firestore';

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';

const navItems = [
  { href: "/", label: "Acasă" },
  { href: "/schedule", label: "Programează o consultație" },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const registrationSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'registration');
  }, [firestore]);

  const { data: registrationSettings } = useDoc(registrationSettingsRef);
  const isRegistrationOpen = registrationSettings?.isPublicRegistrationOpen === true;

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn("flex items-center gap-6 text-sm font-medium", className)}>
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {item.label}
        </Link>
      ))}
       {isRegistrationOpen && !user && (
        <Link
          href="/register"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/register" ? "text-primary" : "text-muted-foreground"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Creare Cont
        </Link>
      )}
      {user && (
         <Link
          href="/admin"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/admin" ? "text-primary" : "text-muted-foreground"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Admin
        </Link>
      )}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-8 hidden md:flex">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-between md:justify-end">
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Comută Meniul</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0 pt-12">
                <div className="flex flex-col gap-6">
                  <Link href="/" className="mb-4" onClick={() => setIsMobileMenuOpen(false)}>
                    <Logo />
                  </Link>
                  <NavLinks className="flex-col items-start gap-4 text-lg" />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="md:hidden">
              <Link href="/">
                <Scale className="h-8 w-8 text-primary" />
                <span className="sr-only">Avocat Law</span>
              </Link>
          </div>

          <div className="hidden md:flex">
            <NavLinks />
          </div>
        </div>
      </div>
    </header>
  );
}
