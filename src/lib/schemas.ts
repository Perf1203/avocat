
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
      message: "Vă rugăm să descrieți pe scurt problema dvs. juridică (cel puțin 10 caractere).",
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

export const RegistrationSchema = z.object({
  email: z.string().email({ message: "Vă rugăm să introduceți o adresă de email validă." }),
  password: z.string().min(6, { message: "Parola trebuie să aibă cel puțin 6 caractere." }),
  confirmPassword: z.string().min(6, { message: "Confirmarea parolei trebuie să aibă cel puțin 6 caractere." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Parolele nu se potrivesc.",
  path: ["confirmPassword"],
});

export const BlogPostSchema = z.object({
  title: z.string().min(5, { message: "Titlul trebuie să aibă cel puțin 5 caractere." }),
  excerpt: z.string().min(10, { message: "Extrasul trebuie să aibă cel puțin 10 caractere." }),
  imageUrl: z.string().url({ message: "Vă rugăm să introduceți un URL valid pentru imagine." }),
  content: z.string().min(50, { message: "Conținutul trebuie să aibă cel puțin 50 de caractere." }),
});

export const TestimonialSchema = z.object({
  quote: z.string().min(10, { message: "Citatul trebuie să aibă cel puțin 10 caractere." }),
  author: z.string().min(3, { message: "Numele autorului trebuie să aibă cel puțin 3 caractere." }),
  title: z.string().min(3, { message: "Titlul autorului trebuie să aibă cel puțin 3 caractere." }),
  avatarUrl: z.string().url({ message: "Vă rugăm să introduceți un URL valid pentru avatar." }).optional().or(z.literal('')),
});
    
export const PriceSchema = z.object({
  title: z.string().min(3, { message: "Titlul trebuie să aibă cel puțin 3 caractere." }),
  description: z.string().min(10, { message: "Descrierea trebuie să aibă cel puțin 10 caractere." }),
  type: z.enum(['flat', 'hourly'], { required_error: "Trebuie să selectați un tip de preț." }),
  flatRate: z.coerce.number().optional(),
  pricePerHour: z.coerce.number().optional(),
}).refine(data => {
    if (data.type === 'flat') return data.flatRate !== undefined && data.flatRate > 0;
    if (data.type === 'hourly') return data.pricePerHour !== undefined && data.pricePerHour > 0;
    return false;
}, {
    message: "Trebuie să specificați o valoare pentru tipul de preț selectat.",
    path: ["flatRate"], // or pricePerHour, error is shown on the first one
});

export const PracticeAreaSchema = z.object({
  icon: z.string().min(2, { message: "Numele iconului trebuie să aibă cel puțin 2 caractere."}),
  title: z.string().min(5, { message: "Titlul trebuie să aibă cel puțin 5 caractere." }),
  description: z.string().min(10, { message: "Descrierea trebuie să aibă cel puțin 10 caractere." }),
});
