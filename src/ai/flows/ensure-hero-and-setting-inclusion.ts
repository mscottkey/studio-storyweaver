'use server';

/**
 * @fileOverview This flow ensures that the hero and setting are included in the generated story text.
 *
 * - ensureHeroAndSettingInclusion - A function that takes the current story context, hero, and setting as input and returns the next part of the story.
 * - EnsureHeroAndSettingInclusionInput - The input type for the ensureHeroAndSettingInclusion function.
 * - EnsureHeroAndSettingInclusionOutput - The return type for the ensureHeroAndSettingInclusion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnsureHeroAndSettingInclusionInputSchema = z.object({
  currentStoryText: z
    .string()
    .describe('The current story text to build upon.'),
  hero: z.string().describe('The name of the hero character.'),
  setting: z.string().describe('The setting of the story.'),
});
export type EnsureHeroAndSettingInclusionInput = z.infer<
  typeof EnsureHeroAndSettingInclusionInputSchema
>;

const EnsureHeroAndSettingInclusionOutputSchema = z.object({
  nextStorySegment: z
    .string()
    .describe('The next segment of the story, incorporating the hero and setting.'),
  choice1: z.string().describe('Choice 1 for continuing the story.'),
  choice2: z.string().describe('Choice 2 for continuing the story.'),
});
export type EnsureHeroAndSettingInclusionOutput = z.infer<
  typeof EnsureHeroAndSettingInclusionOutputSchema
>;

export async function ensureHeroAndSettingInclusion(
  input: EnsureHeroAndSettingInclusionInput
): Promise<EnsureHeroAndSettingInclusionOutput> {
  return ensureHeroAndSettingInclusionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ensureHeroAndSettingInclusionPrompt',
  input: {schema: EnsureHeroAndSettingInclusionInputSchema},
  output: {schema: EnsureHeroAndSettingInclusionOutputSchema},
  prompt: `You are a creative story writer for children. Continue the story based on the current text, weaving in the hero and setting.

Current story:
{{{currentStoryText}}}

Hero:
{{{hero}}}

Setting:
{{{setting}}}

Write the next segment of the story and provide two choices to continue the story.  Make sure the story includes the hero and setting.

Choices should be very short, no more than 5 words each.

Output in JSON format:
{
  "nextStorySegment": "...",
   "choice1": "...",
   "choice2": "..."
}
`,
});

const ensureHeroAndSettingInclusionFlow = ai.defineFlow(
  {
    name: 'ensureHeroAndSettingInclusionFlow',
    inputSchema: EnsureHeroAndSettingInclusionInputSchema,
    outputSchema: EnsureHeroAndSettingInclusionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
