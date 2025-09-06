
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-4">
           <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      )}
      <div className="flex flex-col items-center gap-6">
        <Logo className="text-5xl" />
        <p className="max-w-md text-lg text-foreground/80">
          Ready for an adventure? Let's weave a magical tale together. You bring the hero and the setting, and we'll bring the magic!
        </p>
        <Link href="/create" passHref>
          <Button size="lg" className="font-bold text-lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Start a New Story
          </Button>
        </Link>
        {!user && (
           <Link href="/login" passHref>
             <Button variant="secondary">
                <User className="mr-2 h-5 w-5" />
                Parent Login
            </Button>
          </Link>
        )}
      </div>
    </main>
  );
}
