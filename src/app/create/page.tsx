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
      setProfiles([]);
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
    // Set the field value
    form.setValue(field, value, { 
      shouldValidate: true, 
      shouldDirty: true, 
      shouldTouch: true 
    });
    
    // Set the theme for the story (this will be used when the story is created)
    // but don't change the current UI theme to avoid form interference
    if (theme) {
      form.setValue('theme', theme, { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      });
    }
    
    // Force a re-render to ensure UI updates
    form.trigger(field);
  };

  const handleThemeChange = (newTheme: string) => {
    // Only update the form value for the theme - don't change the current UI theme
    // The theme will be applied when the story is created
    form.setValue('theme', newTheme, { 
      shouldValidate: true, 
      shouldDirty: true, 
      shouldTouch: true 
    });
    // Note: Not calling setTheme() here to avoid UI interference during selection
  };

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
  };

  const handleProfileChange = () => {
    setSelectedProfile(null);
    form.reset();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.hero.trim() || !values.setting.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select or enter both a hero and a setting for your story.',
      });
      return;
    }

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
    } finally {
      setIsWeaving(false);
    }
  }

  // Profile selection screen
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
            <CardContent>
              {profiles.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profiles.map(profile => (
                    <Card 
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile)}
                      className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors hover:scale-105 transform duration-200"
                    >
                      <User className="w-12 h-12 mb-2" />
                      <span className="font-semibold text-center">{profile.name}</span>
                      <span className="text-xs text-muted-foreground">Age {profile.age}</span>
                    </Card>
                  ))}
                  <Card 
                    onClick={() => router.push('/settings')}
                    className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-dashed hover:scale-105 transform duration-200"
                  >
                    <Pencil className="w-12 h-12 mb-2" />
                    <span className="font-semibold text-center">Manage Profiles</span>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No profiles found.</p>
                  <Button onClick={() => router.push('/settings')}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Create Your First Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Story creation form
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
              <Button variant="ghost" onClick={handleProfileChange}>
                <User className="mr-2 h-4 w-4"/> Change Profile
              </Button>
            </div>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
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
                          "flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 transform",
                          form.watch('hero') === preset.name && "bg-primary text-primary-foreground hover:bg-primary/90",
                          selectedProfile.preferredThemes?.includes(preset.theme) && "ring-2 ring-accent"
                        )}
                      >
                        {preset.icon}
                        <span className="mt-2 text-sm text-center font-medium">{preset.name}</span>
                      </Card>
                    ))}
                  </div>
                  <FormField
                    control={form.control}
                    name="hero"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Or type your own hero..." 
                            {...field}
                            className="text-base"
                          />
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
                          "flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 transform",
                          form.watch('setting') === preset.name && "bg-primary text-primary-foreground hover:bg-primary/90",
                          selectedProfile.preferredThemes?.includes(preset.theme) && "ring-2 ring-accent"
                        )}
                      >
                        {preset.icon}
                        <span className="mt-2 text-sm text-center font-medium">{preset.name}</span>
                      </Card>
                    ))}
                  </div>
                  <FormField
                    control={form.control}
                    name="setting"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Or describe your own setting..." 
                            {...field}
                            className="min-h-[80px] text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Optional Theme Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Choose a theme (optional)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'Knight Adventure', theme: 'theme-knight', icon: <Shield className="w-6 h-6" /> },
                      { name: 'Pirate Tales', theme: 'theme-pirate', icon: <Anchor className="w-6 h-6" /> },
                      { name: 'Princess Stories', theme: 'theme-princess', icon: <Castle className="w-6 h-6" /> },
                      { name: 'Space Adventure', theme: 'theme-space', icon: <Rocket className="w-6 h-6" /> },
                    ].map((themeOption) => (
                      <Card 
                        key={themeOption.theme}
                        onClick={() => handleThemeChange(themeOption.theme)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 transform",
                          form.watch('theme') === themeOption.theme && "bg-secondary text-secondary-foreground border-primary"
                        )}
                      >
                        {themeOption.icon}
                        <span className="mt-1 text-xs text-center font-medium">{themeOption.name}</span>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Hidden fields for age and reading level from profile */}
                <FormField 
                  control={form.control} 
                  name="age" 
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="readingLevel" 
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="voice" 
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )} 
                />
                <FormField 
                  control={form.control} 
                  name="profileId" 
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )} 
                />

              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isWeaving || !form.watch('hero') || !form.watch('setting')} 
                  className="w-full font-bold text-lg py-6"
                >
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