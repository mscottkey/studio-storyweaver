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
