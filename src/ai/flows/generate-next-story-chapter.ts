'use server';
/**
 * @fileOverview Generates the next chapter of a 'Choose Your Own Adventure' story based on previous choices and setup.
 *
 * - generateNextStoryChapter - A function that generates the next chapter of the story.
 * - GenerateNextStoryChapterInput - The input type for the generateNextStoryChapter function.
 * - GenerateNextStoryChapterOutput - The return type for the generateNextStoryChapter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNextStoryChapterInputSchema = z.object({
  hero: z.string().describe('The name of the main character in the story.'),
  setting: z.string().describe('The setting of the story.'),
  previousStory: z.string().describe('The story thus far.'),
  choice: z.string().describe('The choice the user made to get to this chapter.'),
  age: z.number().optional().describe('The age of the child reading the story.'),
  readingLevel: z.number().min(1).max(5).optional().describe('The reading level of the child, from 1 (easiest) to 5 (most advanced).'),
});
export type GenerateNextStoryChapterInput = z.infer<typeof GenerateNextStoryChapterInputSchema>;

const GenerateNextStoryChapterOutputSchema = z.object({
  nextChapter: z.string().describe('The next chapter of the story.'),
  choice1: z.string().describe('The first choice the user can make.'),
  choice2: z.string().describe('The second choice the user can make.'),
});
export type GenerateNextStoryChapterOutput = z.infer<typeof GenerateNextStoryChapterOutputSchema>;

export async function generateNextStoryChapter(
  input: GenerateNextStoryChapterInput
): Promise<GenerateNextStoryChapterOutput> {
  return generateNextStoryChapterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNextStoryChapterPrompt',
  input: {schema: GenerateNextStoryChapterInputSchema},
  output: {schema: GenerateNextStoryChapterOutputSchema},
  prompt: `You are a creative storyteller, crafting 'Choose Your Own Adventure' stories for children.

  The story should be tailored for a child of age {{age}} with a reading level of {{readingLevel}} (1 is easiest, 5 is most advanced). Use vocabulary and sentence structures appropriate for that level.

  Continue the story based on the previous story, the user's last choice, the hero, and the setting.

  Previous Story: {{{previousStory}}}
  Last Choice: {{{choice}}}
  Hero: {{{hero}}}
  Setting: {{{setting}}}

  Your response should contain the next chapter of the story, and two choices for the user to continue the story.  Make sure the choices are very different from each other, and will lead to different story outcomes. Try to include the Hero and Setting in the generated story.

  Next Chapter:
  {{nextChapter}}

  Choice 1:
  {{choice1}}

  Choice 2:
  {{choice2}}`,
});

const generateNextStoryChapterFlow = ai.defineFlow(
  {
    name: 'generateNextStoryChapterFlow',
    inputSchema: GenerateNextStoryChapterInputSchema,
    outputSchema: GenerateNextStoryChapterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
