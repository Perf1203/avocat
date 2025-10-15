import { z } from "zod";

export const AppointmentSchema = z.object({
  name: z.string().min(2, { message: "Numele trebuie să aibă cel puțin 2 caractere." }),
  email: z.string().email({ message: "Vă rugăm să introduceți o adresă de email validă." }),
  phone: z
    .string()
    .min(10, { message: "Vă rugăm să introduceți un număr de telefon valid." }),
  issue: z
    .string()
    .min(10, {
      message: "Vă rugăm să descrieți pe scurt problema dvs. (cel puțin 10 caractere).",
    }),
});

export const ContentSuggestionSchema = z.object({
  legalTrends: z
    .string()
    .min(10, { message: "Vă rugăm să oferiți câteva tendințe juridice." }),
  clientFeedback: z
    .string()
    .min(10, { message: "Vă rugăm să oferiți feedback de la clienți." }),
});
