
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/header';
import { UserPlus, Trash2, Edit, X, Check, Shield, Anchor, Castle, Rocket, Trees } from 'lucide-react';
import { getReadingLevelLabel, cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const availableThemes = [
    { id: 'theme-knight', name: 'Knight', icon: <Shield/> },
    { id: 'theme-pirate', name: 'Pirate', icon: <Anchor/> },
    { id: 'theme-princess', name: 'Princess', icon: <Castle/> },
    { id: 'theme-space', name: 'Space', icon: <Rocket/> },
    { id: 'theme-forest', name: 'Forest', icon: <Trees/> },
]

const availableVoices = [
    { id: 'Rachel', name: 'Narrator (Female)' },
    { id: 'Adam', name: 'Narrator (Male)' },
    { id: 'Antoni', name: 'Storyteller (Male)' },
    { id: 'Bella', name: 'Storyteller (Female)' },
    { id: 'Domi', name: 'Animator (Female)' },
    { id: 'Elli', name: 'Child (Female)' },
]

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50),
  age: z.number().min(3).max(12),
  readingLevel: z.number().min(1).max(5),
  preferredThemes: z.array(z.string()).optional(),
  voice: z.string().optional(),
});

const PROFILE_STORAGE_KEY = 'storyweaver-profiles';

export default function SettingsPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedProfiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '[]');
      setProfiles(storedProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load profiles from local storage.',
      });
    }
  }, [toast]);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      age: 7,
      readingLevel: 3,
      preferredThemes: [],
      voice: 'Rachel',
    },
  });

  const editingForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });

  const handleAddNewProfile = (values: z.infer<typeof profileSchema>) => {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      ...values,
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfiles));
    toast({ title: 'Profile added!', description: `${values.name} is ready for an adventure.` });
    form.reset({ name: '', age: 7, readingLevel: 3, preferredThemes: [], voice: 'Rachel' });
    setIsAdding(false);
  };

  const handleDeleteProfile = (id: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfiles));
    toast({ title: 'Profile removed.' });
  };
  
  const handleEditProfile = (values: z.infer<typeof profileSchema>) => {
    if (!editingId) return;
    const updatedProfiles = profiles.map(p => (p.id === editingId ? { ...p, ...values } : p));
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfiles));
    toast({ title: 'Profile updated!' });
    setEditingId(null);
  }

  const startEditing = (profile: Profile) => {
    setEditingId(profile.id);
    editingForm.reset({
        name: profile.name,
        age: profile.age,
        readingLevel: profile.readingLevel,
        preferredThemes: profile.preferredThemes || [],
        voice: profile.voice || 'Rachel',
    });
  }
  
  const renderThemeSelector = (formInstance: any) => (
     <FormField
        control={formInstance.control}
        name="preferredThemes"
        render={() => (
            <FormItem>
            <div className="mb-4">
                <FormLabel className="text-base">Preferred Themes</FormLabel>
                <p className="text-sm text-muted-foreground">Select themes your child enjoys.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableThemes.map((theme) => (
                <FormField
                    key={theme.id}
                    control={formInstance.control}
                    name="preferredThemes"
                    render={({ field }) => {
                    return (
                        <FormItem
                        key={theme.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                        >
                        <FormControl>
                            <Checkbox
                            checked={field.value?.includes(theme.id)}
                            onCheckedChange={(checked) => {
                                return checked
                                ? field.onChange([...(field.value || []), theme.id])
                                : field.onChange(
                                    (field.value || []).filter(
                                    (value: string) => value !== theme.id
                                    )
                                )
                            }}
                            />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2">
                           {theme.icon} {theme.name}
                        </FormLabel>
                        </FormItem>
                    )
                    }}
                />
                ))}
            </div>
            <FormMessage />
            </FormItem>
        )}
    />
  )

  const renderVoiceSelector = (formInstance: any) => (
    <FormField
        control={formInstance.control}
        name="voice"
        render={({ field }) => (
            <FormItem>
                <FormLabel className="text-base">Story-time Voice</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a voice for stories" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {availableVoices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )}
    />
  )

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-headline text-3xl text-primary">Child Profiles</h1>
            {!isAdding && (
              <Button onClick={() => { setIsAdding(true); form.reset({ name: '', age: 7, readingLevel: 3, preferredThemes: [], voice: 'Rachel' }); }}>
                <UserPlus className="mr-2" />
                Add Profile
              </Button>
            )}
          </div>

          {isAdding && (
            <Card className="mb-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddNewProfile)}>
                        <CardHeader>
                            <CardTitle>Add a New Reader</CardTitle>
                            <CardDescription>Create a profile for a new adventurer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Leo" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="age" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Age: {field.value}</FormLabel>
                                        <FormControl>
                                        <Slider min={3} max={12} step={1} defaultValue={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="readingLevel" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reading Level: {getReadingLevelLabel(field.value)}</FormLabel>
                                        <FormControl>
                                            <Slider min={1} max={5} step={1} defaultValue={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            {renderVoiceSelector(form)}
                            {renderThemeSelector(form)}
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="submit">Save Profile</Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map(profile => (
                editingId === profile.id ? (
                     <Card key={profile.id}>
                        <Form {...editingForm}>
                            <form onSubmit={editingForm.handleSubmit(handleEditProfile)}>
                                <CardHeader>
                                    <FormField control={editingForm.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={editingForm.control} name="age" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Age: {field.value}</FormLabel>
                                                <FormControl>
                                                <Slider min={3} max={12} step={1} defaultValue={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={editingForm.control} name="readingLevel" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reading Level: {getReadingLevelLabel(field.value)}</FormLabel>
                                                <FormControl>
                                                    <Slider min={1} max={5} step={1} defaultValue={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                     </div>
                                     {renderVoiceSelector(editingForm)}
                                     {renderThemeSelector(editingForm)}
                                </CardContent>
                                <CardFooter className="justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4"/></Button>
                                    <Button type="submit" size="icon"><Check className="h-4 w-4"/></Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                ) : (
                    <Card key={profile.id} className="flex flex-col">
                        <CardHeader className="flex-grow">
                            <CardTitle>{profile.name}</CardTitle>
                            <CardDescription>Age: {profile.age} | Reading Level: {getReadingLevelLabel(profile.readingLevel)}</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                           <div className="flex flex-wrap gap-2">
                                {profile.preferredThemes && profile.preferredThemes.length > 0 && (
                                  <>
                                    {profile.preferredThemes.map(themeId => {
                                        const theme = availableThemes.find(t => t.id === themeId);
                                        return theme ? <Badge key={themeId} variant="secondary">{theme.name}</Badge> : null;
                                    })}
                                  </>
                                )}
                            </div>
                             {profile.voice && (
                                <div className="text-sm text-muted-foreground">
                                    Voice: {availableVoices.find(v => v.id === profile.voice)?.name || profile.voice}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => startEditing(profile)}><Edit className="h-4 w-4"/></Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteProfile(profile.id)}><Trash2 className="h-4 w-4"/></Button>
                        </CardFooter>
                    </Card>
                )
            ))}
          </div>
            {profiles.length === 0 && !isAdding && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No profiles yet.</p>
                    <p>Click "Add Profile" to get started.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
