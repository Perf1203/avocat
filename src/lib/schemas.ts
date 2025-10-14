import { z } from "zod";

export const AppointmentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z
    .string()
    .min(10, { message: "Please enter a valid phone number." }),
  issue: z
    .string()
    .min(10, {
      message: "Please describe your issue briefly (at least 10 characters).",
    }),
});

export const ContentSuggestionSchema = z.object({
  legalTrends: z
    .string()
    .min(10, { message: "Please provide some legal trends." }),
  clientFeedback: z
    .string()
    .min(10, { message: "Please provide some client feedback." }),
});
