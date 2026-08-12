import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a display name").max(80, "Name is too long"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
