
'use server';

/**
 * @fileOverview Provides kid-friendly definitions for words.
 *
 * - getWordDefinition - A function that returns a simple definition for a word.
 * - GetWordDefinitionInput - The input type for the getWordDefinition function.
 * - GetWordDefinitionOutput - The return type for the getWordDefinition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWordDefinitionInputSchema = z.object({
  word: z.string().describe('The word to be defined.'),
  context: z.string().describe('The full text sentence or paragraph where the word appears.'),
  age: z.number().optional().describe('The age of the child, used to tailor the definition\'s complexity.'),
});
export type GetWordDefinitionInput = z.infer<typeof GetWordDefinitionInputSchema>;

const GetWordDefinitionOutputSchema = z.object({
  definition: z.string().describe('A simple, kid-friendly definition of the word.'),
  pronunciation: z.string().describe('A simple, phonetic pronunciation of the word (e.g., "dy-no-sore").'),
});
export type GetWordDefinitionOutput = z.infer<typeof GetWordDefinitionOutputSchema>;

export async function getWordDefinition(
  input: GetWordDefinitionInput
): Promise<GetWordDefinitionOutput> {
  return getWordDefinitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWordDefinitionPrompt',
  input: {schema: GetWordDefinitionInputSchema},
  output: {schema: GetWordDefinitionOutputSchema},
  prompt: `You are a helpful assistant for children.
A {{age}}-year-old child has asked for the definition of the word "{{word}}".
The word appeared in the following context: "{{context}}"

Provide a very short and simple definition of the word "{{word}}" that a {{age}}-year-old child can easily understand.
Also provide a simple, kid-friendly phonetic pronunciation for the word. For example: "dinosaur (dy-no-sore)".

Do not use the word "{{word}}" in the definition itself.
The definition should be no more than one or two simple sentences.
`,
});

const getWordDefinitionFlow = ai.defineFlow(
  {
    name: 'getWordDefinitionFlow',
    inputSchema: GetWordDefinitionInputSchema,
    outputSchema: GetWordDefinitionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
