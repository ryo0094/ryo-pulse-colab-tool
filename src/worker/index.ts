import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from 'hono/jwt';
import postgres, { Sql } from 'postgres';

type Env = {
  DATABASE_URL: string;
  SUPABASE_JWT_SECRET: string;
};

type Variables = {
  sql: Sql;
  user: { id: string };
}

const app = new Hono<{ Bindings: Env, Variables: Variables }>();

// 1. CORS for all requests
app.use("*", cors({
  origin: ["http://localhost:5173", "https://ryo-pulse-colab-tool.vercel.app"],
}));

// 2. Combined middleware for all API routes
app.use('/api/*', async (c, next) => {
  // a. Initialize DB connection for this request
  const sql = postgres(c.env.DATABASE_URL);
  c.set('sql', sql);

  // b. Define and execute JWT authentication
  const jwtMiddleware = jwt({
    secret: c.env.SUPABASE_JWT_SECRET, // `c` is available here, so this is correct
  });
  const authResponse = await jwtMiddleware(c, async () => {}); // Run auth middleware
  if (authResponse) {
    // If JWT middleware returns a response (e.g., 401 Unauthorized), stop and return it
    return authResponse;
  }

  // c. If auth succeeded, set the user variable from the JWT payload
  const payload = c.get('jwtPayload');
  c.set('user', { id: payload.sub });

  // d. Proceed to the actual route handler (e.g., app.get('/api/channels'))
  await next();
});


app.get('/', (c) => c.text('Pulse Colab Worker is online!'));

// Channel routes
app.get("/api/channels", async (c) => {
  const sql = c.get('sql');
  const channels = await sql`SELECT * FROM channels ORDER BY is_general DESC, name ASC`;
  return c.json(channels);
});

app.post("/api/channels", async (c) => {
  const sql = c.get('sql');
  const { name, description } = await c.req.json();
  
  if (!name || name.trim().length === 0) {
    return c.json({ error: "Channel name is required" }, 400);
  }

  const normalizedName = name.trim();
  
  try {
    const [channel] = await sql`
      INSERT INTO channels (name, description, created_at, updated_at) 
      VALUES (${normalizedName}, ${description || null}, NOW(), NOW())
      RETURNING *
    `;

    return c.json(channel, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Channel name already exists or another database error occurred." }, 409);
  }
});

// Message routes
app.get("/api/channels/:channelId/messages", async (c) => {
  const sql = c.get('sql');
  const channelId = c.req.param("channelId");
  const limit = parseInt(c.req.query("limit") || "50");
  const user = c.get('user');
  
  const messages = await sql`
    SELECT m.*, u.raw_user_meta_data as user_data
    FROM messages m
    LEFT JOIN auth.users u ON m.user_id = u.id::text
    WHERE m.channel_id = ${channelId}
    ORDER BY m.created_at DESC
    LIMIT ${limit}
  `;

  // Reverse to show oldest first
  const messageIds = messages.map((m: any) => m.id);
  if (messageIds.length === 0) return c.json([]);

  const reactions = await sql`
    SELECT message_id, emoji, COUNT(*)::int as count,
           bool_or(user_id::text = ${user.id}) as reacted_by_me
    FROM reactions
    WHERE message_id = ANY(${messageIds})
    GROUP BY message_id, emoji
  `;

  const msgIdToReactions: Record<number, any[]> = {};
  for (const r of reactions) {
    if (!msgIdToReactions[r.message_id]) msgIdToReactions[r.message_id] = [];
    msgIdToReactions[r.message_id].push({ emoji: r.emoji, count: r.count, reactedByMe: r.reacted_by_me });
  }

  const enriched = messages.map((m: any) => ({
    ...m,
    reactions: msgIdToReactions[m.id] || []
  })).reverse();

  return c.json(enriched);
});

app.post("/api/channels/:channelId/messages", async (c) => {
  const sql = c.get('sql');
  const channelId = c.req.param("channelId");
  const { content, attachment_url, attachment_name, attachment_type, attachment_size } = await c.req.json();
  const user = c.get("user");
  
  const hasText = typeof content === 'string' && content.trim().length > 0;
  const hasAttachment = !!attachment_url;
  if (!hasText && !hasAttachment) {
    return c.json({ error: "Message must include text or an attachment" }, 400);
  }

  try {
    const [message] = await sql`
      INSERT INTO messages (
        channel_id, user_id, content,
        attachment_url, attachment_name, attachment_type, attachment_size,
        created_at, updated_at
      ) 
      VALUES (
        ${channelId}, ${user.id}, ${hasText ? content.trim() : null},
        ${attachment_url || null}, ${attachment_name || null}, ${attachment_type || null}, ${attachment_size ?? null},
        NOW(), NOW()
      )
      RETURNING *
    `;

    const [userData] = await sql`SELECT raw_user_meta_data FROM auth.users WHERE id = ${user.id}::uuid`;

    return c.json({
      ...message,
      user_data: userData.raw_user_meta_data
    }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to send message." }, 500);
  }
});

// Toggle reaction on a message
app.post('/api/messages/:messageId/reactions', async (c) => {
  const sql = c.get('sql');
  const user = c.get('user');
  const messageId = parseInt(c.req.param('messageId'));
  const { emoji } = await c.req.json();

  if (!emoji || typeof emoji !== 'string') {
    return c.json({ error: 'Emoji is required' }, 400);
  }

  try {
    const existing = await sql`
      SELECT id FROM reactions WHERE message_id = ${messageId} AND user_id = ${user.id}::uuid AND emoji = ${emoji}
    `;

    if (existing.length > 0) {
      await sql`DELETE FROM reactions WHERE id = ${existing[0].id}`;
    } else {
      await sql`
        INSERT INTO reactions (message_id, user_id, emoji) VALUES (${messageId}, ${user.id}::uuid, ${emoji})
      `;
    }

    // Return latest counts for this message
    const rows = await sql`
      SELECT emoji, COUNT(*)::int as count, bool_or(user_id::text = ${user.id}) as reacted_by_me
      FROM reactions WHERE message_id = ${messageId}
      GROUP BY emoji
    `;
    return c.json(rows.map((r: any) => ({ emoji: r.emoji, count: r.count, reactedByMe: r.reacted_by_me })));
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to toggle reaction' }, 500);
  }
});

export default app;
