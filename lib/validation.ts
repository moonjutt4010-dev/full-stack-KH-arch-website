import { z } from "zod";

export const services = ["Architecture", "Interior design", "Planning & consultation"] as const;
export const statuses = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export const consultationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email.").max(254).transform(v => v.toLowerCase()),
  phone: z.string().trim().max(30).regex(/^[+\d\s().-]*$/, "Please enter a valid phone number.").optional().default(""),
  service: z.enum(services),
  location: z.string().trim().min(2, "Please enter the project location.").max(160),
  budget: z.enum(["To be discussed", "Under $100k", "$100k–$500k", "$500k–$1m", "$1m+"]),
  message: z.string().trim().min(20, "Please tell us a little more (at least 20 characters).").max(4000),
  consent: z.literal(true, { error: "Please agree to the privacy policy." }),
  website: z.string().max(0).optional().default(""),
}).strict();
export const statusSchema = z.object({ id: z.uuid(), status: z.enum(statuses), previousStatus: z.enum(statuses) });
export type LeadStatus = typeof statuses[number];
export type Lead = { id: string; name: string; email: string; phone: string; service: string; location: string; budget: string; message: string; status: LeadStatus; created_at: string; customer_id: string | null };
export type Notification = { id: string; message: string; read_at: string | null; created_at: string };
