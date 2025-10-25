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

app.use('/api/*', async (c, next) => {
  const sql = postgres(c.env.DATABASE_URL);
  c.set('sql', sql);

  const jwtMiddleware = jwt({
    secret: c.env.SUPABASE_JWT_SECRET,
  });

  return jwtMiddleware(c, next);
});

app.use('/api/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  c.set('user', { id: payload.sub });
  await next();
});

// Enable CORS for all routes
app.use("*", cors({
  origin: ["http://localhost:5173", "https://pulse-colab.vercel.app"],
}));



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

  const normalizedName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  
  try {
    const [channel] = await sql`
      INSERT INTO channels (name, description, created_at, updated_at) 
      VALUES (${normalizedName}, ${description || null}, NOW(), NOW())
      RETURNING *
    `;

    return c.json(channel, 201);
  } catch (error) {
    return c.json({ error: "Channel name already exists" }, 409);
  }
});

// Message routes
app.get("/api/channels/:channelId/messages", async (c) => {
  const sql = c.get('sql');
  const channelId = c.req.param("channelId");
  const limit = parseInt(c.req.query("limit") || "50");
  
  const messages = await sql`
    SELECT m.*, u.raw_user_meta_data as user_data
    FROM messages m
    LEFT JOIN auth.users u ON m.user_id = u.id
    WHERE m.channel_id = ${channelId}
    ORDER BY m.created_at DESC
    LIMIT ${limit}
  `;

  // Reverse to show oldest first
  return c.json(messages.reverse());
});

app.post("/api/channels/:channelId/messages", async (c) => {
  const sql = c.get('sql');
  const channelId = c.req.param("channelId");
  const { content } = await c.req.json();
  const user = c.get("user");
  
  if (!content || content.trim().length === 0) {
    return c.json({ error: "Message content is required" }, 400);
  }

  const [message] = await sql`
    INSERT INTO messages (channel_id, user_id, content, created_at, updated_at) 
    VALUES (${channelId}, ${user.id}, ${content.trim()}, NOW(), NOW())
    RETURNING *
  `;

  const [userData] = await sql`SELECT raw_user_meta_data FROM auth.users WHERE id = ${user.id}`;

  return c.json({
    ...message,
    user_data: userData.raw_user_meta_data
  }, 201);
});

export default app;
