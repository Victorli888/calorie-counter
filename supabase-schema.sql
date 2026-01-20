-- Calorie Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create the entries table
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

-- Create a policy that allows all operations
-- Adjust this policy based on your security requirements
-- For a simple personal tracker, allowing all operations is fine
CREATE POLICY "Allow all operations" ON entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
