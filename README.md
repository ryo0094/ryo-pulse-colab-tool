# Pulse Colab

This is a real-time chat application built with a modern tech stack. The backend is powered by Cloudflare Workers and uses Supabase for authentication and its Postgres database. The frontend is a React application built with Vite.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono
- **Database & Auth**: Supabase

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

This project requires two sets of environment variables.

#### Frontend Variables

Create a `.env` file in the root of the project. The frontend Vite server will automatically load these.

```
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

#### Backend Secrets

The Cloudflare Worker backend requires secrets for the database connection string and JWT verification. Set these using the `wrangler` CLI. These will be stored locally and encrypted.

```bash
# Set the database connection string
npx wrangler secret put DATABASE_URL

# Set the Supabase JWT secret
npx wrangler secret put SUPABASE_JWT_SECRET
```

Wrangler will prompt you to paste each secret into the terminal.

### 3. Run the Development Server

Once the dependencies are installed and the environment variables are configured, you can start the development server:

```bash
npm run dev
```

This will start the Vite frontend server and the Cloudflare Worker backend simultaneously.