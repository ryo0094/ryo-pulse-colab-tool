import z from "zod";

export const ChannelSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_general: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MessageSchema = z.object({
  id: z.number(),
  channel_id: z.number(),
  user_id: z.string(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  attachment_url: z.string().nullable().optional(),
  attachment_name: z.string().nullable().optional(),
  attachment_type: z.string().nullable().optional(),
  attachment_size: z.number().nullable().optional(),
  reactions: z.array(z.object({
    emoji: z.string(),
    count: z.number(),
    reactedByMe: z.boolean().optional(),
  })).optional(),
  user_data: z.object({
    email: z.string(),
    email_verified: z.boolean(),
    family_name: z.string().nullable().optional(),
    given_name: z.string().nullable().optional(),
    hd: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    picture: z.string().nullable().optional(),
    sub: z.string(),
  }).optional(),
});

export type Channel = z.infer<typeof ChannelSchema>;
export type Message = z.infer<typeof MessageSchema>;
