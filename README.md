# Calorie Tracker

A simple calorie and protein tracking application built with Deno Fresh and Supabase.

## Features

- **Daily Tracker**: Add, edit, and remove food entries for the current day
- **Real-time Totals**: See your total calories and protein intake for the day
- **History View**: View all past days grouped by month with totals
- **Persistent Storage**: Data is stored in Supabase and persists across sessions

## Setup

### Prerequisites

- [Deno](https://deno.land/manual/getting_started/installation) installed
- A Supabase account and project

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_name text NOT NULL,
  calories integer NOT NULL,
  protein integer NOT NULL,
  entry_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for efficient date queries
CREATE INDEX idx_entry_date ON entries(entry_date);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations" ON entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials to `.env`:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these values in your Supabase project settings under "API".

### Running Locally

1. Start the development server:
   ```bash
   deno task start
   ```

2. Open your browser to `http://localhost:8000`

### Building for Production

```bash
deno task build
```

The built files will be in the `_fresh/static` directory.

## Deployment to Deno Deploy

1. Push your code to GitHub
2. Connect your repository to Deno Deploy
3. Set environment variables in Deno Deploy dashboard:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
4. Set the entrypoint to `main.ts`
5. Deploy!

## Project Structure

- `routes/` - Page routes (server-side)
- `islands/` - Interactive components (client-side)
- `utils/` - Utility functions (Supabase client)
- `static/` - Static assets (CSS, images)

## License

MIT
