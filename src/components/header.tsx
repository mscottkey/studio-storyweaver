import Link from 'next/link';
import { Logo } from './logo';
import { Button } from './ui/button';
import { Home, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AppHeader() {
  const { user } = useAuth();
  return (
    <header className="p-4 flex justify-between items-center border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
      <Logo />
      <div className="flex items-center gap-2">
        {user && (
          <Link href="/settings" passHref>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        )}
        <Link href="/" passHref>
          <Button variant="ghost" size="icon" aria-label="Home">
            <Home className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
