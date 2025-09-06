
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ensureHeroAndSettingInclusion } from '@/ai/flows/ensure-hero-and-setting-inclusion';
import type { Story, Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Shield, Anchor, Castle, Rocket, Trees, Palmtree, Stars, Sparkles, User, Pencil } from 'lucide-react';
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
  voice: z.string().optional(),
  profileId: z.string().optional(),
});

const STORY_STORAGE_KEY = 'storyweaver-stories';
const PROFILE_STORAGE_KEY = 'storyweaver-profiles';

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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      const storedProfiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '[]');
      setProfiles(storedProfiles);
    } catch (error) {
      console.error("Failed to load profiles", error);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hero: '',
      setting: '',
      age: 7,
      readingLevel: 3,
      theme: 'light',
      voice: 'Rachel',
    },
  });

  useEffect(() => {
    if (selectedProfile) {
      form.reset({
        hero: '',
        setting: '',
        age: selectedProfile.age,
        readingLevel: selectedProfile.readingLevel,
        theme: selectedProfile.preferredThemes?.[0] || 'light',
        voice: selectedProfile.voice || 'Rachel',
        profileId: selectedProfile.id,
      });
      setTheme(selectedProfile.preferredThemes?.[0] || 'light');
    }
  }, [selectedProfile, form, setTheme]);

  const handlePresetClick = (field: 'hero' | 'setting', value: string, theme?: string) => {
    form.setValue(field, value);
    if (theme) {
        form.setValue('theme', theme);
        setTheme(theme);
    }
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
        voice: values.voice,
        profileId: values.profileId,
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

  if (!selectedProfile) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-primary">Who is this story for?</CardTitle>
              <CardDescription>Select a profile to begin a new adventure.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profiles.map(profile => (
                <Card 
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <User className="w-12 h-12 mb-2" />
                  <span className="font-semibold">{profile.name}</span>
                </Card>
              ))}
               <Card 
                  onClick={() => router.push('/settings')}
                  className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-dashed"
                >
                  <Pencil className="w-12 h-12 mb-2" />
                  <span className="font-semibold">Manage Profiles</span>
                </Card>
            </CardContent>
             {profiles.length === 0 && (
                <CardFooter>
                    <p className="text-sm text-muted-foreground">No profiles found. <Link href="/settings" className="underline">Create one</Link> to get started.</p>
                </CardFooter>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-headline text-3xl text-primary">Let's Begin, {selectedProfile.name}!</CardTitle>
                <CardDescription>Choose a hero and a setting, or create your own!</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedProfile(null)}>
                <User className="mr-2 h-4 w-4"/> Change Profile
              </Button>
            </div>
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
                                    form.watch('hero') === preset.name && "bg-primary text-primary-foreground",
                                    selectedProfile.preferredThemes?.includes(preset.theme) && "ring-2 ring-accent"
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
                                    form.watch('setting') === preset.name && "bg-primary text-primary-foreground",
                                    selectedProfile.preferredThemes?.includes(preset.theme) && "ring-2 ring-accent"
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

                {/* Age and Reading Level (now hidden, from profile) */}
                <FormField control={form.control} name="age" render={({ field }) => <FormItem><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>} />
                <FormField control={form.control} name="readingLevel" render={({ field }) => <FormItem><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>} />

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
