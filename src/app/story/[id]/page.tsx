
'use client';

import { useEffect, useState, useRef } from 'react';
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
import { Loader2, BookOpen, Sparkles, Volume2, Pause, Play } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/components/theme-provider';

const STORY_STORAGE_KEY = 'storyweaver-stories';

const Word = ({ word, context, age }: { word: string; context: string; age?: number }) => {
  const [definition, setDefinition] = useState('');
  const [isDefining, setIsDefining] = useState(false);
  const [isReadingDefinition, setIsReadingDefinition] = useState(false);
  const definitionAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleWordClick = async () => {
    if (definition) return; // Don't re-fetch if we already have it
    setIsDefining(true);
    try {
      const result = await getWordDefinition({ word: word.replace(/[^a-zA-Z]/g, ''), context, age });
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

  const handleReadDefinition = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent popover from closing
    if (isReadingDefinition || !definition) return;

    setIsReadingDefinition(true);
    try {
      // NOTE: Using default voice for definitions for now.
      const result = await textToSpeech({ text: definition });
      const audio = new Audio(result.media);
      definitionAudioRef.current = audio;
      audio.play();
      audio.onended = () => setIsReadingDefinition(false);
    } catch (error) {
      console.error('Failed to read definition:', error);
      toast({
        variant: 'destructive',
        title: 'Bards are busy!',
        description: 'Could not read the definition aloud right now.',
      });
      setIsReadingDefinition(false);
    }
  }

  const hasLetters = /[a-zA-Z]/.test(word);
  if (!hasLetters) {
    return <span>{word}</span>;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span onClick={handleWordClick} className="hover:underline decoration-dotted cursor-pointer hover:text-accent">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent onPointerDownOutside={(e) => {
          if (definitionAudioRef.current && !definitionAudioRef.current.paused) {
            e.preventDefault();
          }
      }}>
        {isDefining && <div className='flex items-center gap-2'><Loader2 className="h-4 w-4 animate-spin"/> Thinking...</div>}
        {definition && (
            <div className="flex items-start gap-2">
                <p className="flex-grow">{definition}</p>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReadDefinition}
                    disabled={isReadingDefinition}
                    className="flex-shrink-0 h-6 w-6"
                >
                    {isReadingDefinition ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                </Button>
            </div>
        )}
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
  const { setTheme } = useTheme();
  
  const [isGeneratingStoryAudio, setIsGeneratingStoryAudio] = useState(false);
  const [isStoryPlaying, setIsStoryPlaying] = useState(false);
  const [storyAudioUrl, setStoryAudioUrl] = useState<string | null>(null);
  const storyAudioRef = useRef<HTMLAudioElement>(null);

  const [isGeneratingChoiceAudio, setIsGeneratingChoiceAudio] = useState(false);
  const [isChoicePlaying, setIsChoicePlaying] = useState(false);
  const [choiceAudioUrl, setChoiceAudioUrl] = useState<string | null>(null);
  const choiceAudioRef = useRef<HTMLAudioElement>(null);

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
        if (currentStory.theme) {
          setTheme(currentStory.theme);
        }
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

    return () => {
        setTheme('light'); // Reset to default theme when leaving story
    }
  }, [params.id, router, toast, setTheme]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [story?.chapters.length]);

  // Effect for Story Audio Player
  useEffect(() => {
    const audio = storyAudioRef.current;
    if (audio) {
      const onPlay = () => setIsStoryPlaying(true);
      const onPause = () => setIsStoryPlaying(false);
      const onEnded = () => {
        setIsStoryPlaying(false);
        setStoryAudioUrl(null);
      };
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      return () => {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
      }
    }
  }, [storyAudioUrl]);

  // Effect for Choice Audio Player
  useEffect(() => {
    const audio = choiceAudioRef.current;
    if (audio) {
      const onPlay = () => setIsChoicePlaying(true);
      const onPause = () => setIsChoicePlaying(false);
      const onEnded = () => {
        setIsChoicePlaying(false);
        setChoiceAudioUrl(null);
      };
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      return () => {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
      }
    }
  }, [choiceAudioUrl]);


  const stopAllAudio = () => {
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
    }
    if (choiceAudioRef.current) {
        choiceAudioRef.current.pause();
    }
    setStoryAudioUrl(null);
    setChoiceAudioUrl(null);
    setIsStoryPlaying(false);
    setIsChoicePlaying(false);
  }

  const handleChoice = async (choice: string) => {
    if (!story || !choice.trim()) return;

    stopAllAudio();
    
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

  const handlePlayStoryAudio = async () => {
    const audio = storyAudioRef.current;
    if (audio && storyAudioUrl) {
      if (isStoryPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      return;
    }

    if (!story || isGeneratingStoryAudio) return;
    
    setIsGeneratingStoryAudio(true);
    try {
      const lastChapter = story.chapters[story.chapters.length - 1];
      const result = await textToSpeech({ text: lastChapter.chapterText, voice: story.voice || 'Rachel' });
      setStoryAudioUrl(result.media);
    } catch (error) {
      console.error('Failed to generate audio:', error);
      toast({
        variant: 'destructive',
        title: 'The bards are taking a break...',
        description: 'The text-to-speech service seems to be overloaded. Please try again in a moment.',
      });
    } finally {
      setIsGeneratingStoryAudio(false);
    }
  };

  const handlePlayChoicesAudio = async () => {
    const audio = choiceAudioRef.current;
    if (audio && choiceAudioUrl) {
        if (isChoicePlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        return;
    }

    if (!story || isGeneratingChoiceAudio || story.currentChoices.length === 0) return;

    setIsGeneratingChoiceAudio(true);
    try {
        const textToRead = `What would you like to do next?\n\nChoice 1: ${story.currentChoices[0]}\n\nChoice 2: ${story.currentChoices[1]}`;
        const result = await textToSpeech({ text: textToRead, voice: story.voice || 'Rachel' });
        setChoiceAudioUrl(result.media);
    } catch (error) {
        console.error('Failed to generate choice audio:', error);
        toast({
            variant: 'destructive',
            title: 'The town crier is out of breath...',
            description: 'Could not read the choices aloud. Please try again.',
        });
    } finally {
        setIsGeneratingChoiceAudio(false);
    }
  };
  
  useEffect(() => {
    if (storyAudioUrl && storyAudioRef.current) {
        storyAudioRef.current.play();
    }
  }, [storyAudioUrl]);

  useEffect(() => {
    if (choiceAudioUrl && choiceAudioRef.current) {
        choiceAudioRef.current.play();
    }
  }, [choiceAudioUrl]);


  if (!story) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isAudioBusy = isGeneratingStoryAudio || isGeneratingChoiceAudio || loadingAI;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 gap-6 overflow-hidden">
        <Card className="flex-grow flex flex-col overflow-hidden shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-grow">
                <CardTitle className="font-headline text-2xl md:text-3xl text-primary flex items-center gap-2">
                  <BookOpen />
                  The Tale of {story.hero}
                </CardTitle>
                <CardDescription>in the land of {story.setting}</CardDescription>
              </div>
              <div className='flex-shrink-0'>
                <Button
                    onClick={handlePlayStoryAudio}
                    disabled={isAudioBusy}
                    variant="outline"
                    aria-label={isStoryPlaying ? 'Pause audio' : 'Play story audio'}
                    >
                    {isGeneratingStoryAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : isStoryPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    <span className="ml-2 hidden sm:inline">{isStoryPlaying ? 'Pause' : 'Read Story'}</span>
                </Button>
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
          <div className="flex justify-center items-center mb-4">
            <h2 className="text-center font-headline text-xl text-primary">What happens next?</h2>
             {story.currentChoices.length > 0 && (
                <Button
                    onClick={handlePlayChoicesAudio}
                    disabled={isAudioBusy}
                    variant="ghost"
                    size="icon"
                    aria-label={isChoicePlaying ? 'Pause choices audio' : 'Play choices audio'}
                    className='ml-2'
                >
                    {isGeneratingChoiceAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : isChoicePlaying ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
            )}
          </div>
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
      {storyAudioUrl && <audio ref={storyAudioRef} src={storyAudioUrl} />}
      {choiceAudioUrl && <audio ref={choiceAudioRef} src={choiceAudioUrl} />}
    </div>
  );
}
