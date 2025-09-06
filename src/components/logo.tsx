import { BookHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <BookHeart className="w-8 h-8 text-accent" />
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        StoryWeaver
      </h1>
    </div>
  );
}
