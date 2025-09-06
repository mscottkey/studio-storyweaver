import { config } from 'dotenv';
config();

import '@/ai/flows/generate-next-story-chapter.ts';
import '@/ai/flows/ensure-hero-and-setting-inclusion.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/get-word-definition.ts';
