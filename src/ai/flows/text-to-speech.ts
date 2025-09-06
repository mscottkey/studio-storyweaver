'use server';

/**
 * @fileOverview A flow for converting text to speech using ElevenLabs.
 *
 * - textToSpeech - A function that takes text and returns audio data.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voice: z.string().optional().default('Rachel').describe('The name of the voice to use for the speech.'),
});

export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
    media: z.string().describe("The generated audio as a data URI. Expected format: 'data:audio/mpeg;base64,<encoded_data>'."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
    input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
    return textToSpeechFlow(input);
}

// Map voice names to ElevenLabs voice IDs
const voiceMap: Record<string, string> = {
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Adam': 'pNInz6obpgDQGcFmaJgB',
    'Antoni': 'ErXwobaYiN019PkySvjV',
    'Bella': 'EXAVITQu4vr4xnSDxMaL',
    'Domi': 'AZnzlk1XvdvUeBnXmlld',
    'Elli': 'MF3mGyEYCl7XYWbV9V6O',
};

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({text, voice}) => {
    const voiceId = voiceMap[voice || 'Rachel'] || voiceMap['Rachel'];
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      throw new Error('ElevenLabs API key is not configured.');
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`ElevenLabs API request failed with status ${response.status}: ${errorBody}`);
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        
        return {
            media: `data:audio/mpeg;base64,${base64Audio}`,
        };

    } catch (error) {
        console.error("Error in textToSpeechFlow:", error);
        throw new Error('Failed to generate audio from ElevenLabs.');
    }
  }
);
