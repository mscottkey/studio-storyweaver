'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Story, StoryChapter } from '@/lib/types';
import { generateNextStoryChapter } from '@/ai/flows/generate-next-story-chapter';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

const STORY_STORAGE_KEY = 'storyweaver-stories';

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [customChoice, setCustomChoice] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storyId = params.id;
    if (typeof storyId !== 'string') {
      router.push('/create');
      return;
    }

    try {
      const existingStories: Story[] = JSON.parse(localStorage.getItem(STORY_STORAGE_KEY) || '[]');
      const currentStory = existingStories.find(s => s.id === storyId);

      if (currentStory) {
        setStory(currentStory);
      } else {
        toast({
          variant: 'destructive',
          title: 'Story not found!',
          description: "We couldn't find that story. Let's start a new one.",
        });
        router.push('/create');
      }
    } catch (error) {
      console.error('Failed to load story from localStorage', error);
      router.push('/create');
    }
  }, [params.id, router, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [story?.chapters.length]);

  const handleChoice = async (choice: string) => {
    if (!story || !choice.trim()) return;

    setLoadingAI(true);
    setCustomChoice('');
    try {
      const previousStory = story.chapters
        .map(c => `Choice: ${c.choiceMade}\n${c.chapterText}`)
        .join('\n\n---\n\n');

      const result = await generateNextStoryChapter({
        hero: story.hero,
        setting: story.setting,
        previousStory,
        choice,
      });

      const newChapter: StoryChapter = {
        id: crypto.randomUUID(),
        chapterText: result.nextChapter,
        choiceMade: choice,
      };

      const updatedStory: Story = {
        ...story,
        chapters: [...story.chapters, newChapter],
        currentChoices: [result.choice1, result.choice2],
        updatedAt: new Date().toISOString(),
      };

      setStory(updatedStory);

      // Persist to localStorage
      const existingStories: Story[] = JSON.parse(localStorage.getItem(STORY_STORAGE_KEY) || '[]');
      const storyIndex = existingStories.findIndex(s => s.id === story.id);
      if (storyIndex > -1) {
        existingStories[storyIndex] = updatedStory;
        localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(existingStories));
      }
    } catch (error) {
      console.error('Failed to generate next chapter:', error);
      toast({
        variant: 'destructive',
        title: 'The crystal ball is cloudy...',
        description: 'There was an issue generating the next part of your story. Please try again.',
      });
    } finally {
      setLoadingAI(false);
    }
  };

  if (!story) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 gap-6 overflow-hidden">
        <Card className="flex-grow flex flex-col overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl md:text-3xl text-primary flex items-center gap-2">
              <BookOpen />
              The Tale of {story.hero}
            </CardTitle>
            <CardDescription>in the land of {story.setting}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="p-6 space-y-8 text-lg/relaxed">
                {story.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="animate-fade-in-up">
                    {index > 0 && (
                      <Badge variant="secondary" className="mb-2 italic">Your choice: {chapter.choiceMade}</Badge>
                    )}
                    <p className="whitespace-pre-wrap">{chapter.chapterText}</p>
                  </div>
                ))}
                 {loadingAI && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="flex-shrink-0 pb-4">
          <h2 className="text-center font-headline text-xl text-primary mb-4">What happens next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {story.currentChoices.length > 0 ? (
              story.currentChoices.map((choice, index) => (
                <Button
                  key={index}
                  onClick={() => handleChoice(choice)}
                  disabled={loadingAI}
                  size="lg"
                  className="h-auto py-3 text-base"
                  variant={index === 0 ? 'default' : 'secondary'}
                >
                  <span className="whitespace-normal text-center">{choice}</span>
                </Button>
              ))
            ) : (
                <p className="text-center md:col-span-2 text-muted-foreground italic">...and the story comes to a close. For now.</p>
            )}
          </div>
            {story.currentChoices.length > 0 && (
                <>
                    <Separator className="my-6" />
                    <div className="relative text-center">
                        <span className="bg-background px-2 text-sm text-muted-foreground">Or, write your own path... (Premium)</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Input
                            placeholder="What do you do?"
                            value={customChoice}
                            onChange={(e) => setCustomChoice(e.target.value)}
                            disabled={loadingAI}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleChoice(customChoice);
                              }
                            }}
                        />
                        <Button
                            onClick={() => handleChoice(customChoice)}
                            disabled={loadingAI || !customChoice.trim()}
                            aria-label="Submit custom choice"
                        >
                            <Sparkles className="h-5 w-5" />
                        </Button>
                    </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
}
