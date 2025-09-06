'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Story, StoryChapter } from '@/lib/types';
import { generateNextStoryChapter } from '@/ai/flows/generate-next-story-chapter';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { getWordDefinition } from '@/ai/flows/get-word-definition';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Sparkles, Volume2, Pause, Play, HelpCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const STORY_STORAGE_KEY = 'storyweaver-stories';

const Word = ({ word, context, age }: { word: string; context: string; age?: number }) => {
  const [definition, setDefinition] = useState('');
  const [isDefining, setIsDefining] = useState(false);
  const { toast } = useToast();

  const handleWordClick = async () => {
    if (definition) return; // Don't re-fetch if we already have it
    setIsDefining(true);
    try {
      const result = await getWordDefinition({ word, context, age });
      setDefinition(result.definition);
    } catch (error) {
      console.error('Failed to get definition:', error);
      toast({
        variant: 'destructive',
        title: 'Wizard is stumped!',
        description: 'Could not get a definition for that word.',
      });
    } finally {
      setIsDefining(false);
    }
  };

  // Regular expression to check if the word contains any letters.
  const hasLetters = /[a-zA-Z]/.test(word);
  if (!hasLetters) {
    return <span>{word}</span>;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span onClick={handleWordClick} className="underline decoration-dotted cursor-pointer hover:text-accent">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent>
        {isDefining && <div className='flex items-center gap-2'><Loader2 className="h-4 w-4 animate-spin"/> Thinking...</div>}
        {definition && <p>{definition}</p>}
      </PopoverContent>
    </Popover>
  );
};


export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [customChoice, setCustomChoice] = useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Rachel');
  const audioRef = useRef<HTMLAudioElement>(null);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        setAudioUrl(null); // Clear audio so it can be re-generated
      };
    }
  }, [audioUrl]);

  const handleChoice = async (choice: string) => {
    if (!story || !choice.trim()) return;

    // Stop any playing audio before proceeding
    if (audioRef.current) {
        audioRef.current.pause();
    }
    setAudioUrl(null);
    setIsPlaying(false);
    
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
        age: story.age,
        readingLevel: story.readingLevel,
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

  const handlePlayAudio = async () => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      return;
    }

    if (!story || isGeneratingAudio) return;
    
    setIsGeneratingAudio(true);
    try {
      const lastChapter = story.chapters[story.chapters.length - 1];
      const textToRead = `${lastChapter.chapterText}\n\nWhat would you like to do next?\n\nChoice 1: ${story.currentChoices[0]}\n\nChoice 2: ${story.currentChoices[1]}`;

      const result = await textToSpeech({ text: textToRead, voice: selectedVoice });
      setAudioUrl(result.media);
    } catch (error) {
      console.error('Failed to generate audio:', error);
      toast({
        variant: 'destructive',
        title: 'The bards are taking a break...',
        description: 'The audio service is temporarily unavailable. Please try again in a moment.',
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };
  
  useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.play();
    }
  }, [audioUrl]);

  if (!story) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const voices = ["Rachel", "Adam", "Antoni", "Bella", "Domi", "Elli"];

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 gap-6 overflow-hidden">
        <Card className="flex-grow flex flex-col overflow-hidden shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline text-2xl md:text-3xl text-primary flex items-center gap-2">
                  <BookOpen />
                  The Tale of {story.hero}
                </CardTitle>
                <CardDescription>in the land of {story.setting}</CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                    onClick={handlePlayAudio}
                    disabled={isGeneratingAudio || loadingAI}
                    variant="outline"
                    size="icon"
                    aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                    >
                    {isGeneratingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <div className='w-40'>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isGeneratingAudio || isPlaying}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                            {voices.map(voice => (
                                <SelectItem key={voice} value={voice} className="capitalize">{voice.charAt(0).toUpperCase() + voice.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
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
                    <p className="whitespace-pre-wrap">
                      {chapter.chapterText.split(/(\s+)/).map((word, i) => (
                          <Word key={i} word={word} context={chapter.chapterText} age={story.age} />
                      ))}
                    </p>
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
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}
    </div>
  );
}
