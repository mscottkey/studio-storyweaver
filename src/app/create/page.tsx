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
import { Loader2, Wand2 } from 'lucide-react';
import { AppHeader } from '@/components/header';
import { Slider } from '@/components/ui/slider';

const formSchema = z.object({
  hero: z.string().min(2, { message: 'Hero name must be at least 2 characters.' }).max(50),
  setting: z.string().min(5, { message: 'Setting must be at least 5 characters.' }).max(200),
  age: z.number().min(3).max(12),
  readingLevel: z.number().min(1).max(5),
});

const STORY_STORAGE_KEY = 'storyweaver-stories';

export default function CreateStoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isWeaving, setIsWeaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hero: '',
      setting: '',
      age: 7,
      readingLevel: 3,
    },
  });

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
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Let's Begin the Adventure</CardTitle>
            <CardDescription>Every great story needs a hero and a place. Who and where will yours be?</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="hero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Who is the hero?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A brave knight named Arthur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="setting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Where does the story take place?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., In a shimmering, enchanted forest" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel className="text-lg">Reading Level: {field.value}</FormLabel>
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
