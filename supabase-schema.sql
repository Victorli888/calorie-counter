-- Calorie Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create the entries table
CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_name text NOT NULL,
  calories integer NOT NULL,
  protein integer NOT NULL,
  entry_date date, -- DEPRECATED: Made nullable. Application uses created_at instead.
  created_at timestamp with time zone DEFAULT now() NOT NULL -- Single source of truth for all date operations
);

-- If you already have the table with entry_date NOT NULL, run this to make it nullable:
-- ALTER TABLE entries ALTER COLUMN entry_date DROP NOT NULL;

-- Index for efficient timestamp queries (primary index for date filtering)
CREATE INDEX idx_created_at ON entries(created_at DESC);

-- Legacy index (kept for backward compatibility, but not used by application)
CREATE INDEX idx_entry_date ON entries(entry_date);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations
-- Adjust this policy based on your security requirements
-- For a simple personal tracker, allowing all operations is fine
CREATE POLICY "Allow all operations" ON entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
