import Link from 'next/link';
import { Logo } from './logo';
import { Button } from './ui/button';
import { Home } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="p-4 flex justify-between items-center border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
      <Logo />
      <Link href="/" passHref>
        <Button variant="ghost" size="icon" aria-label="Home">
          <Home className="w-5 h-5" />
        </Button>
      </Link>
    </header>
  );
}
