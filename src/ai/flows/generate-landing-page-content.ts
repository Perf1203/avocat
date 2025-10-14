'use server';

/**
 * @fileOverview AI-powered tool that suggests headlines, body text, and calls to action for the landing page.
 *
 * - generateLandingPageContent - A function that handles the generation of landing page content.
 * - GenerateLandingPageContentInput - The input type for the generateLandingPageContent function.
 * - GenerateLandingPageContentOutput - The return type for the generateLandingPageContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLandingPageContentInputSchema = z.object({
  legalTrends: z
    .string()
    .describe('Current legal trends to incorporate into the content.'),
  clientFeedback: z
    .string()
    .describe('Recent client feedback to address in the content.'),
  currentHeadline: z.string().optional().describe('The current headline on the landing page.'),
  currentBody: z.string().optional().describe('The current body text on the landing page.'),
  currentCallToAction: z.string().optional().describe('The current call to action on the landing page.'),
});
export type GenerateLandingPageContentInput = z.infer<typeof GenerateLandingPageContentInputSchema>;

const GenerateLandingPageContentOutputSchema = z.object({
  suggestedHeadline: z.string().describe('A suggested headline for the landing page.'),
  suggestedBodyText: z.string().describe('Suggested body text for the landing page.'),
  suggestedCallToAction: z
    .string()
    .describe('A suggested call to action for the landing page.'),
});
export type GenerateLandingPageContentOutput = z.infer<typeof GenerateLandingPageContentOutputSchema>;

export async function generateLandingPageContent(
  input: GenerateLandingPageContentInput
): Promise<GenerateLandingPageContentOutput> {
  return generateLandingPageContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLandingPageContentPrompt',
  input: {schema: GenerateLandingPageContentInputSchema},
  output: {schema: GenerateLandingPageContentOutputSchema},
  prompt: `You are an expert copywriter specializing in legal services websites. Based on current legal trends and client feedback, generate suggestions for the landing page headline, body text, and call to action.  Consider the current content to ensure the suggestions are new and enhance the current message.

Current Headline: {{currentHeadline}}
Current Body Text: {{currentBody}}
Current Call to Action: {{currentCallToAction}}

Current Legal Trends: {{legalTrends}}
Client Feedback: {{clientFeedback}}

Provide a compelling headline, engaging body text, and a clear call to action that addresses the legal trends and client feedback. Focus on trust, authority, and client needs.

Headline:  
Body Text:
Call to Action:`,
});

const generateLandingPageContentFlow = ai.defineFlow(
  {
    name: 'generateLandingPageContentFlow',
    inputSchema: GenerateLandingPageContentInputSchema,
    outputSchema: GenerateLandingPageContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
