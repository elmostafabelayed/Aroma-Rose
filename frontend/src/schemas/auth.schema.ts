import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'L’adresse e-mail est requise')
    .email('Veuillez entrer une adresse e-mail valide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

