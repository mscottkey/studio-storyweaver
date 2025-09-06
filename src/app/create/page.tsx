'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ensureHeroAndSettingInclusion } from '@/ai/flows/ensure-hero-and-setting-inclusion';
import type { Story } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Shield, Anchor, Castle, Rocket, Trees, Palmtree, Stars, Sparkles } from 'lucide-react';
import { AppHeader } from '@/components/header';
import { Slider } from '@/components/ui/slider';
import { getReadingLevelLabel, cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/theme-provider';

const formSchema = z.object({
  hero: z.string().min(2, { message: 'Hero name must be at least 2 characters.' }).max(50),
  setting: z.string().min(5, { message: 'Setting must be at least 5 characters.' }).max(200),
  age: z.number().min(3).max(12),
  readingLevel: z.number().min(1).max(5),
  theme: z.string().optional(),
});

const STORY_STORAGE_KEY = 'storyweaver-stories';

const heroPresets = [
  { name: 'A Brave Knight', icon: <Shield className="w-8 h-8" />, theme: 'theme-knight' },
  { name: 'A Swashbuckling Pirate', icon: <Anchor className="w-8 h-8" />, theme: 'theme-pirate' },
  { name: 'A Royal Princess', icon: <Castle className="w-8 h-8" />, theme: 'theme-princess' },
  { name: 'A Daring Astronaut', icon: <Rocket className="w-8 h-8" />, theme: 'theme-space' },
];

const settingPresets = [
  { name: 'An enchanted forest', icon: <Trees className="w-8 h-8" />, theme: 'theme-forest' },
  { name: 'A mysterious island', icon: <Palmtree className="w-8 h-8" />, theme: 'theme-pirate' },
  { name: 'A sparkling kingdom', icon: <Sparkles className="w-8 h-8" />, theme: 'theme-princess' },
  { name: 'The far reaches of space', icon: <Stars className="w-8 h-8" />, theme: 'theme-space' },
];


export default function CreateStoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isWeaving, setIsWeaving] = useState(false);
  const { setTheme } = useTheme();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hero: '',
      setting: '',
      age: 7,
      readingLevel: 3,
      theme: 'light',
    },
  });

  const handlePresetClick = (field: 'hero' | 'setting', value: string, theme: string) => {
    form.setValue(field, value);
    form.setValue('theme', theme);
    setTheme(theme);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsWeaving(true);
    try {
      const initialStory = await ensureHeroAndSettingInclusion({
        currentStoryText: '',
        hero: values.hero,
        setting: values.setting,
        age: values.age,
        readingLevel: values.readingLevel,
      });

      const newStory: Story = {
        id: Date.now().toString(),
        hero: values.hero,
        setting: values.setting,
        age: values.age,
        readingLevel: values.readingLevel,
        theme: values.theme,
        chapters: [
          {
            id: crypto.randomUUID(),
            chapterText: initialStory.nextStorySegment,
            choiceMade: 'The beginning',
          },
        ],
        currentChoices: [initialStory.choice1, initialStory.choice2],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingStories: Story[] = JSON.parse(localStorage.getItem(STORY_STORAGE_KEY) || '[]');
      localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify([...existingStories, newStory]));

      toast({
        title: "Your story has begun!",
        description: "Let's see where it goes...",
      });

      router.push(`/story/${newStory.id}`);
    } catch (error) {
      console.error('Failed to start story:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no, a dragon blocked the path!',
        description: 'We had trouble starting your story. Please try again.',
      });
      setIsWeaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Let's Begin the Adventure</CardTitle>
            <CardDescription>Choose a hero and a setting, or create your own!</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-8">
                
                {/* Hero Selection */}
                <div className="space-y-4">
                    <Label className="text-lg font-semibold">Who is the hero?</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {heroPresets.map((preset) => (
                            <Card 
                                key={preset.name}
                                onClick={() => handlePresetClick('hero', preset.name, preset.theme)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                                    form.watch('hero') === preset.name && "bg-primary text-primary-foreground"
                                )}
                            >
                                {preset.icon}
                                <span className="mt-2 text-sm text-center">{preset.name}</span>
                            </Card>
                        ))}
                    </div>
                     <FormField
                        control={form.control}
                        name="hero"
                        render={({ field }) => (
                            <FormItem>
                            <FormControl>
                                <Input placeholder="Or type your own hero..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                
                {/* Setting Selection */}
                <div className="space-y-4">
                    <Label className="text-lg font-semibold">Where does the story take place?</Label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {settingPresets.map((preset) => (
                            <Card 
                                key={preset.name}
                                onClick={() => handlePresetClick('setting', preset.name, preset.theme)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                                    form.watch('setting') === preset.name && "bg-primary text-primary-foreground"
                                )}
                            >
                                {preset.icon}
                                <span className="mt-2 text-sm text-center">{preset.name}</span>
                            </Card>
                        ))}
                    </div>
                    <FormField
                    control={form.control}
                    name="setting"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea placeholder="Or describe your own setting..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                {/* Age and Reading Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-lg">Reader's Age: {field.value}</FormLabel>
                        <FormControl>
                            <Slider
                            min={3}
                            max={12}
                            step={1}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="readingLevel"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-lg">Reading Level: {getReadingLevelLabel(field.value)}</FormLabel>
                        <FormControl>
                            <Slider
                            min={1}
                            max={5}
                            step={1}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isWeaving} className="w-full font-bold text-lg">
                  {isWeaving ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-5 w-5" />
                  )}
                  {isWeaving ? 'Weaving your story...' : 'Weave my Story'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
